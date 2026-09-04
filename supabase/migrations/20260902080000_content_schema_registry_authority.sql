begin;

-- Phase 2 / Slice 09: the CMS content-schema registry is private canonical
-- state.  Clients reach it only through the eight named platform_api RPCs.

create extension if not exists pgsodium;

-- The release-principal authority is owned by Slice 07.  S09 only adds the
-- nullable public-key and rotation-window evidence it needs to verify a
-- signed release.  Keeping the columns nullable preserves existing
-- configuration fixtures while making an unprovisioned key unusable here.
alter table platform_private.cfg_release_principals
  add column if not exists public_key bytea,
  add column if not exists valid_from timestamptz,
  add column if not exists valid_through timestamptz,
  add column if not exists revoked_at timestamptz;

-- A release principal is an auth actor, while each key is an independently
-- rotatable trust identity.  Keep key IDs globally unique for unambiguous
-- envelope lookup, but make the principal/key pair the row identity so an
-- old and new key may overlap for one principal during rotation.
alter table platform_private.cfg_release_principals
  drop constraint if exists cfg_release_principals_pkey;
alter table platform_private.cfg_release_principals
  add constraint cfg_release_principals_pkey primary key (principal_id, key_id);
create index if not exists cfg_release_principals_principal_idx
  on platform_private.cfg_release_principals (principal_id);

create type platform_private.cms_definition_state as enum (
  'draft', 'review', 'approved', 'scheduled', 'active', 'superseded',
  'retired', 'blocked'
);

create or replace function platform_private.cms_json_depth(p_value jsonb)
returns integer
language plpgsql
immutable
set search_path = ''
as $body$
declare
  child jsonb;
  deepest integer := 0;
  child_depth integer;
begin
  if p_value is null or pg_catalog.jsonb_typeof(p_value) not in ('object', 'array') then
    return 0;
  end if;
  if pg_catalog.jsonb_typeof(p_value) = 'object' then
    for child in select value from pg_catalog.jsonb_each(p_value) loop
      child_depth := platform_private.cms_json_depth(child);
      if child_depth > deepest then deepest := child_depth; end if;
    end loop;
  else
    for child in select value from pg_catalog.jsonb_array_elements(p_value) loop
      child_depth := platform_private.cms_json_depth(child);
      if child_depth > deepest then deepest := child_depth; end if;
    end loop;
  end if;
  return deepest + 1;
end;
$body$;

create or replace function platform_private.cms_json_bounded(
  p_value jsonb,
  p_max_bytes integer default 8192,
  p_max_depth integer default 8,
  p_max_keys integer default 128,
  p_max_array integer default 128
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
     or pg_catalog.octet_length(p_value::text) > p_max_bytes
     or platform_private.cms_json_depth(p_value) > p_max_depth then
    return false;
  end if;
  if pg_catalog.jsonb_typeof(p_value) = 'object' then
    if (select count(*) from pg_catalog.jsonb_each(p_value)) > p_max_keys then return false; end if;
    for child in select value from pg_catalog.jsonb_each(p_value) loop
      if not platform_private.cms_json_bounded(child, p_max_bytes, p_max_depth, p_max_keys, p_max_array) then
        return false;
      end if;
    end loop;
  elsif pg_catalog.jsonb_typeof(p_value) = 'array' then
    if pg_catalog.jsonb_array_length(p_value) > p_max_array then return false; end if;
    for child in select value from pg_catalog.jsonb_array_elements(p_value) loop
      if not platform_private.cms_json_bounded(child, p_max_bytes, p_max_depth, p_max_keys, p_max_array) then
        return false;
      end if;
    end loop;
  end if;
  return true;
end;
$body$;

-- A compiled artifact is server-generated from the bounded request and stores
-- the canonical field arrays twice in its editor manifest.  Keep the generic
-- 8 KiB JSON cell ceiling for caller-controlled columns, while giving this
-- aggregate a fixed 512 KiB ceiling (the 256 KiB request limit plus the
-- compiler's deliberate duplication headroom).  Depth, object-key, and array
-- bounds remain unchanged and are enforced by the shared immutable helper.
create or replace function platform_private.cms_compiled_manifest_bounded(p_value jsonb)
returns boolean
language sql
immutable
strict
set search_path = ''
as $body$
  select platform_private.cms_json_bounded(p_value, 524288, 8, 128, 128)
$body$;

create or replace function platform_private.cms_exact_keys(
  p_value jsonb,
  p_required text[],
  p_allowed text[]
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  key_name text;
begin
  if p_value is null or pg_catalog.jsonb_typeof(p_value) <> 'object' then return false; end if;
  if p_required is not null and cardinality(p_required) > 0 and not p_value ?& p_required then return false; end if;
  for key_name in select value from pg_catalog.jsonb_object_keys(p_value) as value loop
    if p_allowed is null or not key_name = any(p_allowed) then return false; end if;
  end loop;
  return true;
end;
$body$;

create or replace function platform_private.cms_valid_hash(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_value is not null and p_value ~ '^[a-f0-9]{64}$'
$body$;

-- PostgreSQL's base64 decoder accepts non-zero unused pad bits.  Signed
-- evidence uses the canonical padded spelling so equivalent byte strings
-- cannot have multiple accepted wire representations.
create or replace function platform_private.cms_valid_base64(p_value text)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  padding integer;
  alphabet_position integer;
  meaningful text;
begin
  if p_value is null
     or p_value = ''
     or pg_catalog.length(p_value) % 4 <> 0
     or p_value !~ '^[A-Za-z0-9+/]+={0,2}$' then
    return false;
  end if;
  padding := case
    when pg_catalog.right(p_value, 2) = '==' then 2
    when pg_catalog.right(p_value, 1) = '=' then 1
    else 0
  end;
  if padding = 0 then return true; end if;
  meaningful := pg_catalog.substr(p_value, pg_catalog.length(p_value) - padding, 1);
  alphabet_position := pg_catalog.strpos(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
    meaningful
  );
  if alphabet_position = 0 then return false; end if;
  return case
    when padding = 2 then (alphabet_position - 1) % 16 = 0
    else (alphabet_position - 1) % 4 = 0
  end;
end;
$body$;

create or replace function platform_private.cms_valid_uuid(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_value is not null
    and p_value ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
$body$;

create or replace function platform_private.cms_valid_version(p_value text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_value is not null and p_value ~ '^[1-9][0-9]*$'
$body$;

create or replace function platform_private.cms_request_hash(p_request jsonb)
returns bytea
language sql
immutable
set search_path = ''
as $body$
  select extensions.digest(
    pg_catalog.convert_to((coalesce(p_request, '{}'::jsonb) - 'idempotencyKey')::text, 'utf8'),
    'sha256'
  )
$body$;

create or replace function platform_private.cms_key_hash(p_key text)
returns bytea
language sql
immutable
set search_path = ''
as $body$
  select extensions.digest(pg_catalog.convert_to(p_key, 'utf8'), 'sha256')
$body$;

create or replace function platform_private.cms_reserved_key(p_key text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select lower(coalesce(p_key, '')) = any(array[
    'user', 'users', 'person', 'persons', 'account', 'accounts', 'session',
    'sessions', 'identity', 'identities', 'party', 'parties', 'profile',
    'profiles', 'asset', 'assets', 'menu', 'menus', 'setting', 'settings',
    'comment', 'comments', 'credit', 'credits', 'right', 'rights', 'money',
    'mandate', 'mandates', 'dispute', 'disputes', 'entitlement',
    'entitlements', 'credential', 'credentials', 'evidence', 'institution',
    'institutions', 'institution_gate', 'course', 'courses', 'lesson',
    'lessons', 'authority', 'authorities', 'permission', 'permissions',
    'role', 'roles', 'billing', 'payment', 'payments', 'transaction',
    'transactions'
  ])
$body$;

-- RFC 8785-compatible canonical JSON for the bounded JSON values accepted by
-- this slice. PostgreSQL jsonb already rejects duplicate object members and
-- normalizes JSON strings; these helpers supply deterministic UTF-8 key
-- ordering, compact separators, and ECMAScript-compatible number thresholds.
create or replace function platform_private.cms_jcs_number(p_value jsonb)
returns text
language plpgsql
stable
strict
set search_path = ''
as $body$
declare
  token text;
  sign text := '';
  integer_part text;
  fraction_part text;
  digits text;
  first_nonzero integer;
  exponent integer;
  mantissa text;
  absolute_value numeric;
begin
  token := pg_catalog.trim_scale((p_value::text)::numeric)::text;
  if token = '0' then return '0'; end if;
  if left(token, 1) = '-' then
    sign := '-';
    token := substring(token from 2);
  end if;
  absolute_value := token::numeric;
  if position('.' in token) > 0 then
    integer_part := split_part(token, '.', 1);
    fraction_part := split_part(token, '.', 2);
  else
    integer_part := token;
    fraction_part := '';
  end if;
  integer_part := ltrim(integer_part, '0');
  if integer_part = '' then
    first_nonzero := 0;
    for scan_position in 1..length(fraction_part) loop
      if substring(fraction_part from scan_position for 1) <> '0' then
        first_nonzero := scan_position;
        exit;
      end if;
    end loop;
    if first_nonzero = 0 or first_nonzero > length(fraction_part) then
      return '0';
    end if;
    if absolute_value >= 0.000001::numeric then
      return sign || '0.' || fraction_part;
    end if;
    digits := rtrim(substring(fraction_part from first_nonzero), '0');
    exponent := -first_nonzero;
  else
    if absolute_value < 1000000000000000000000::numeric then
      return sign || integer_part || case when fraction_part = '' then '' else '.' || fraction_part end;
    end if;
    digits := rtrim(integer_part || fraction_part, '0');
    exponent := length(integer_part) - 1;
  end if;
  mantissa := left(digits, 1)
    || case when length(digits) > 1 then '.' || substring(digits from 2) else '' end;
  return sign || mantissa || 'e' || case when exponent >= 0 then '+' else '' end || exponent::text;
end;
$body$;

create or replace function platform_private.cms_jcs(p_value jsonb)
returns text
language plpgsql
stable
strict
set search_path = ''
as $body$
declare
  value_type text;
  child jsonb;
  member record;
  encoded text;
begin
  value_type := pg_catalog.jsonb_typeof(p_value);
  if value_type = 'null' then return 'null'; end if;
  if value_type = 'boolean' then return p_value::text; end if;
  if value_type = 'string' then
    return pg_catalog.to_jsonb(p_value #>> '{}')::text;
  end if;
  if value_type = 'number' then
    return platform_private.cms_jcs_number(p_value);
  end if;
  if value_type = 'array' then
    encoded := '';
    for child in select value from pg_catalog.jsonb_array_elements(p_value) as value loop
      if encoded <> '' then encoded := encoded || ','; end if;
      encoded := encoded || platform_private.cms_jcs(child);
    end loop;
    return '[' || encoded || ']';
  end if;
  encoded := '';
  for member in
    select key, value
    from pg_catalog.jsonb_each(p_value)
    order by key collate "C"
  loop
    if encoded <> '' then encoded := encoded || ','; end if;
    encoded := encoded || pg_catalog.to_jsonb(member.key::text)::text
      || ':' || platform_private.cms_jcs(member.value);
  end loop;
  return '{' || encoded || '}';
end;
$body$;

create or replace function platform_private.cms_jcs_sha256(p_value jsonb)
returns text
language sql
stable
strict
set search_path = ''
as $body$
  select pg_catalog.encode(
    extensions.digest(
      pg_catalog.convert_to(platform_private.cms_jcs(p_value), 'utf8'),
      'sha256'
    ),
    'hex'
  )
$body$;

-- The release worker verifies the untouched HTTP bytes before forwarding an
-- RPC. `releaseRawBodyHash` is therefore a worker attestation, not a value
-- SQL can recompute after JSONB parsing has discarded wire formatting. SQL
-- binds that attested hash into its own Ed25519 payload and verifies the
-- signature; changing the hash, operation, or release headers invalidates the
-- signature instead of silently accepting a different release envelope.
drop function if exists platform_private.cms_release_body_hash(jsonb);
drop function if exists platform_private.cms_release_body(jsonb);

create or replace function platform_private.cms_release_signing_payload(
  p_request jsonb,
  p_operation_id text
)
returns text
language sql
stable
strict
set search_path = ''
as $body$
  select 'WEJAMMIN-' || p_operation_id || '-RELEASE-V1' || chr(10)
    || coalesce(p_request->>'releaseKeyId', '') || chr(10)
    || coalesce(p_request->>'releaseIssuedAt', '') || chr(10)
    || coalesce(p_request->>'releaseNonce', '') || chr(10)
    || coalesce(p_request->>'releaseRawBodyHash', '')
$body$;

create or replace function platform_private.cms_props_attestation_payload(p_request jsonb)
returns text
language sql
immutable
strict
set search_path = ''
as $body$
  select 'WEJAMMIN-CMS-03A-05-PROPS-V1' || chr(10)
    || coalesce(p_request->>'blockKey', '') || chr(10)
    || coalesce(p_request->>'blockVersion', '') || chr(10)
    || coalesce(p_request->>'propsSchemaRef', '') || chr(10)
    || coalesce(p_request->>'propsSchemaHash', '') || chr(10)
    || coalesce(p_request->>'propsSnapshotHash', '') || chr(10)
    || coalesce(p_request->>'releaseDigest', '')
$body$;

-- Protected registry members are code-owned invariants until the owning
-- cross-shard registry RPCs exist.  These functions are intentionally closed
-- sets: grammar alone never authorizes a new capability, workflow, validator,
-- projection, renderer, data source, schema reference, or compiler.
create or replace function platform_private.cms_capability_registry_valid(
  p_key text,
  p_version bigint default null
)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select exists (
    select 1
    from (values
      ('cms.schema_designer', 1::bigint),
      ('cms.schema_registry.read', 1::bigint),
      ('cms.public_content.read', 1::bigint),
      ('cms.content.article', 1::bigint),
      ('cms.article.card', 1::bigint)
    ) as registry(key, version)
    where registry.key = p_key
      and (p_version is null or registry.version = p_version)
  )
$body$;

create or replace function platform_private.cms_workflow_registry_valid(
  p_key text,
  p_version bigint
)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select coalesce((p_key, p_version) in (
    values ('editorial', 1::bigint), ('editorial.default', 1::bigint),
           ('cms.content.workflow', 1::bigint), ('cms.standard', 1::bigint)
  ), false)
$body$;

create or replace function platform_private.cms_validator_registry_valid(
  p_key text,
  p_version bigint
)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select coalesce((p_key, p_version) in (
    values
      ('cms.text', 1::bigint), ('cms.slug', 1::bigint),
      ('cms.integer', 1::bigint), ('cms.decimal', 1::bigint),
      ('cms.date', 1::bigint), ('cms.datetime', 1::bigint),
      ('cms.enum', 1::bigint), ('cms.relation', 1::bigint),
      ('cms.media', 1::bigint), ('cms.url', 1::bigint),
      ('cms.locale', 1::bigint)
  ), false)
$body$;

create or replace function platform_private.cms_projection_registry_valid(
  p_target_kind text,
  p_target_type text,
  p_projection_key text
)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select (p_target_kind, p_target_type, p_projection_key) in (
    values
      ('content', 'article', 'cms.article.card'),
      ('content', 'article', 'public.summary'),
      ('content', 'artist', 'public.summary'),
      ('domain', 'profile', 'profile.summary'),
      ('domain', 'profile', 'public.summary'),
      ('domain', 'person', 'public.summary'),
      ('domain', 'organization', 'public.summary')
  )
$body$;

create or replace function platform_private.cms_renderer_registry_valid(p_ref text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_ref in (
    'cms/renderers/hero/1', 'renderer/hero-banner', 'blocks/hero-banner',
    'renderers/cms.hero.v3'
  )
$body$;

create or replace function platform_private.cms_schema_ref_registry_valid(p_ref text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_ref in (
    'cms/blocks/hero/1', 'cms/blocks/hero-banner/1',
    'schemas/blocks/hero-v3.json'
  )
$body$;

create or replace function platform_private.cms_data_source_registry_valid(p_key text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select platform_private.cms_capability_registry_valid(p_key, null)
$body$;

create or replace function platform_private.cms_compiler_registry_valid(p_version text)
returns boolean
language sql
immutable
set search_path = ''
as $body$
  select p_version in ('1', '1.0', '1.0.0', '1.9')
$body$;

create or replace function platform_private.cms_block_key_registry_valid(
  p_key text,
  p_current_key text default null
)
returns boolean
language sql
stable
set search_path = ''
as $body$
  select coalesce(p_key = p_current_key, false)
    or p_key in ('hero', 'hero-banner', 'cms.hero', 'cms.hero.banner')
$body$;

-- Renderer manifests bind an exact, immutable block-version tuple.  A key
-- alone is not sufficient: a later release may register another version or
-- withdraw the referenced version while a schema is waiting for approval.
-- Lifecycle is derived from the append-only event stream; the version row is
-- intentionally never updated by the lifecycle command.
create or replace function platform_private.cms_block_reference_valid(
  p_reference jsonb
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  requested_block_key text;
  requested_block_version bigint;
  current_lifecycle text;
begin
  if pg_catalog.jsonb_typeof(p_reference) <> 'object'
     or not platform_private.cms_exact_keys(
       p_reference,
       array['blockKey','blockVersion','lifecycle']::text[],
       array['blockKey','blockVersion','lifecycle']::text[]
     )
     or p_reference->>'blockKey' !~ '^[a-z][a-z0-9._-]{0,95}$'
     or pg_catalog.jsonb_typeof(p_reference->'blockVersion') <> 'number'
     or p_reference->>'blockVersion' !~ '^[1-9][0-9]{0,9}$'
     or p_reference->>'lifecycle' not in ('supported', 'deprecated', 'withdrawn') then
    return false;
  end if;
  requested_block_key := p_reference->>'blockKey';
  requested_block_version := (p_reference->>'blockVersion')::bigint;
  select block_row.block_key,
         block_row.block_version,
         coalesce(
           (
             select lifecycle_event.to_lifecycle
             from platform_private.cms_block_definition_lifecycle_events lifecycle_event
             where lifecycle_event.block_definition_version_id = block_row.id
             order by lifecycle_event.created_at desc, lifecycle_event.id desc
             limit 1
           ),
           'supported'
         )
    into requested_block_key, requested_block_version, current_lifecycle
    from platform_private.cms_block_definition_versions block_row
   where block_row.block_key = requested_block_key
     and block_row.block_version = requested_block_version
     and block_row.state = 'registered';
  if not found then
    return false;
  end if;
  return current_lifecycle <> 'withdrawn'
     and p_reference->>'lifecycle' = current_lifecycle;
exception when others then
  return false;
end;
$body$;

create or replace function platform_private.cms_template_registry_valid(p_id uuid)
returns boolean
language plpgsql
stable
set search_path = ''
as $body$
declare
  candidate regclass;
  found_id boolean;
begin
  if p_id is null then return false; end if;
  foreach candidate in array array[
    to_regclass('platform_private.cms_template_versions'),
    to_regclass('content_private.cms_template_versions'),
    to_regclass('platform_private.template_versions')
  ] loop
    if candidate is not null then
      execute format('select exists (select 1 from %s where id = $1)', candidate)
        into found_id using p_id;
      if found_id then return true; end if;
    end if;
  end loop;
  return false;
end;
$body$;

create or replace function platform_private.cms_canonical_type_definition(p_request jsonb)
returns jsonb
language plpgsql
stable
strict
set search_path = ''
as $body$
declare
  fields jsonb;
  relations jsonb;
  templates jsonb;
  capabilities jsonb;
begin
  select coalesce(
    pg_catalog.jsonb_agg(value order by value->>'stableFieldId', value->>'key'),
    '[]'::jsonb
  ) into fields
  from pg_catalog.jsonb_array_elements(coalesce(p_request->'fields', '[]'::jsonb)) as entries(value);
  select coalesce(
    pg_catalog.jsonb_agg(value order by value->>'fieldId', value->>'projectionKey'),
    '[]'::jsonb
  ) into relations
  from pg_catalog.jsonb_array_elements(coalesce(p_request->'relations', '[]'::jsonb)) as entries(value);
  select coalesce(
    pg_catalog.jsonb_agg(value order by value->>'templateVersionId'),
    '[]'::jsonb
  ) into templates
  from pg_catalog.jsonb_array_elements(coalesce(p_request->'templateBindings', '[]'::jsonb)) as entries(value);
  select coalesce(
    pg_catalog.jsonb_agg(value order by value->>'capabilityKey', value->>'capabilityVersion'),
    '[]'::jsonb
  ) into capabilities
  from pg_catalog.jsonb_array_elements(coalesce(p_request->'capabilityBindings', '[]'::jsonb)) as entries(value);
  return jsonb_build_object(
    'typeKey', p_request->>'typeKey',
    'label', pg_catalog.normalize(p_request->>'label', 'NFC'),
    'ownerCapability', p_request->>'ownerCapability',
    'sourceLocale', p_request->>'sourceLocale',
    'defaultLocale', p_request->>'defaultLocale',
    'workflowKey', p_request->>'workflowKey',
    'workflowVersion', p_request->>'workflowVersion',
    'defaultTemplateVersionId', p_request->'defaultTemplateVersionId',
    'fields', fields,
    'relations', relations,
    'templateBindings', templates,
    'capabilityBindings', capabilities
  );
end;
$body$;

create or replace function platform_private.cms_compiled_editor_manifest(p_request jsonb)
returns jsonb
language sql
stable
strict
set search_path = ''
as $body$
  select jsonb_build_object(
    'schema', platform_private.cms_canonical_type_definition(p_request),
    'fields', platform_private.cms_canonical_type_definition(p_request)->'fields'
  )
$body$;

create or replace function platform_private.cms_compiled_renderer_manifest(p_request jsonb)
returns jsonb
language sql
stable
strict
set search_path = ''
as $body$
  select jsonb_build_object(
    'relations', platform_private.cms_canonical_type_definition(p_request)->'relations',
    'templateBindings', platform_private.cms_canonical_type_definition(p_request)->'templateBindings',
    'capabilityBindings', platform_private.cms_canonical_type_definition(p_request)->'capabilityBindings'
  )
$body$;

create or replace function platform_private.cms_definition_artifact_hash(p_request jsonb)
returns text
language sql
stable
strict
set search_path = ''
as $body$
  select platform_private.cms_jcs_sha256(jsonb_build_object(
    'compilerVersion', '1',
    'zodContractRef', 'cms/content-type/' || (p_request->>'typeKey') || '/v1',
    'editorManifest', platform_private.cms_compiled_editor_manifest(p_request),
    'rendererManifest', platform_private.cms_compiled_renderer_manifest(p_request)
  ))
$body$;

create or replace function platform_private.cms_valid_field_input(
  p_value jsonb,
  p_require_stable_id boolean default true
)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  constraints jsonb;
  editor_config jsonb;
  kind text;
begin
  if not platform_private.cms_exact_keys(
    p_value,
    case when p_require_stable_id
      then array['stableFieldId','key','kind','constraints','required','validatorKey','validatorVersion','defaultMode','localizationMode','editorConfig','lifecycle']::text[]
      else array['key','kind','constraints','required','validatorKey','validatorVersion','defaultMode','localizationMode','editorConfig','lifecycle']::text[]
    end,
    array['stableFieldId','key','kind','constraints','required','validatorKey','validatorVersion','defaultMode','defaultValue','localizationMode','editorConfig','lifecycle']::text[]
  ) then
    return false;
  end if;
  if p_require_stable_id and not platform_private.cms_valid_uuid(p_value->>'stableFieldId') then return false; end if;
  if not p_require_stable_id and p_value ? 'stableFieldId'
     and not platform_private.cms_valid_uuid(p_value->>'stableFieldId') then return false; end if;
  if p_value->>'key' !~ '^[a-z][a-z0-9_]{1,63}$' or platform_private.cms_reserved_key(p_value->>'key') then return false; end if;
  kind := p_value->>'kind';
  if kind not in (
    'short_text', 'long_text', 'rich_text', 'boolean', 'integer', 'decimal',
    'date', 'datetime', 'enum', 'taxonomy', 'relation', 'media', 'object', 'list'
  ) then return false; end if;
  constraints := p_value->'constraints';
  if pg_catalog.jsonb_typeof(constraints) <> 'object'
     or not platform_private.cms_json_bounded(constraints, 8192, 4, 64, 256)
     or exists (select 1 from pg_catalog.jsonb_object_keys(constraints) key_name
       where key_name not in ('minLength','maxLength','minimum','maximum','enumValues','itemKind')) then
    return false;
  end if;
  if constraints ? 'minLength' and (
       pg_catalog.jsonb_typeof(constraints->'minLength') <> 'number'
       or (constraints->>'minLength') !~ '^[0-9]+$'
       or (constraints->>'minLength')::numeric > 100000
     ) then return false; end if;
  if constraints ? 'maxLength' and (
       pg_catalog.jsonb_typeof(constraints->'maxLength') <> 'number'
       or (constraints->>'maxLength') !~ '^[0-9]+$'
       or (constraints->>'maxLength')::numeric > 100000
     ) then return false; end if;
  if constraints ? 'minLength' and constraints ? 'maxLength'
     and (constraints->>'minLength')::numeric > (constraints->>'maxLength')::numeric then return false; end if;
  if constraints ? 'minimum' and pg_catalog.jsonb_typeof(constraints->'minimum') <> 'number' then return false; end if;
  if constraints ? 'maximum' and pg_catalog.jsonb_typeof(constraints->'maximum') <> 'number' then return false; end if;
  if constraints ? 'minimum' and constraints ? 'maximum'
     and (constraints->>'minimum')::numeric > (constraints->>'maximum')::numeric then return false; end if;
  if constraints ? 'enumValues' then
    if pg_catalog.jsonb_typeof(constraints->'enumValues') <> 'array'
       or pg_catalog.jsonb_array_length(constraints->'enumValues') > 256
       or exists (select 1 from pg_catalog.jsonb_array_elements(constraints->'enumValues') enum_entry
         where pg_catalog.jsonb_typeof(enum_entry) <> 'string'
           or pg_catalog.length(enum_entry #>> '{}') > 160) then return false; end if;
  end if;
  if constraints ? 'itemKind' and (constraints->>'itemKind') not in (
    'short_text', 'long_text', 'rich_text', 'boolean', 'integer', 'decimal',
    'date', 'datetime', 'enum', 'taxonomy', 'relation', 'media', 'object', 'list'
  ) then return false; end if;
  if pg_catalog.jsonb_typeof(p_value->'required') <> 'boolean'
     or p_value->>'defaultMode' not in ('none','literal','inherited')
     or p_value->>'localizationMode' not in ('none','localized','no_fallback')
     or p_value->>'lifecycle' not in ('active','deprecated','retired') then return false; end if;
  if (p_value->>'validatorKey' is null) <> (p_value->>'validatorVersion' is null) then return false; end if;
  if p_value->>'validatorKey' is not null
     and (p_value->>'validatorKey') !~ '^[a-z][a-z0-9._-]{0,127}$' then return false; end if;
  if p_value->>'validatorVersion' is not null
     and (
       not platform_private.cms_valid_version(p_value->>'validatorVersion')
       or not platform_private.cms_validator_registry_valid(
         p_value->>'validatorKey', (p_value->>'validatorVersion')::bigint
       )
     ) then return false; end if;
  if p_value->>'defaultMode' = 'literal'
     and (not (p_value ? 'defaultValue') or p_value->'defaultValue' = 'null'::jsonb) then return false; end if;
  if p_value->>'defaultMode' in ('none','inherited') and p_value ? 'defaultValue' then return false; end if;
  if p_value ? 'defaultValue'
     and not platform_private.cms_json_bounded(p_value->'defaultValue', 262144, 8, 128, 128) then return false; end if;
  editor_config := p_value->'editorConfig';
  if not platform_private.cms_exact_keys(
    editor_config,
    array['label','order']::text[],
    array['label','helpText','order']::text[]
  ) or pg_catalog.length(pg_catalog.normalize(editor_config->>'label', 'NFC')) not between 1 and 120
    or (editor_config ? 'helpText' and pg_catalog.length(pg_catalog.normalize(editor_config->>'helpText', 'NFC')) > 500)
    or pg_catalog.jsonb_typeof(editor_config->'order') <> 'number'
    or (editor_config->>'order') !~ '^[0-9]+$'
    or (editor_config->>'order')::numeric > 10000 then return false; end if;
  return true;
exception when invalid_text_representation or numeric_value_out_of_range or invalid_parameter_value then
  return false;
end;
$body$;

create or replace function platform_private.cms_valid_relation_input(p_value jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $body$
declare
  min_count integer;
  max_count integer;
begin
  if not platform_private.cms_exact_keys(
    p_value,
    array['fieldId','targetKind','targetType','projectionKey','cardinality','min','max','ordered','onUnavailable']::text[],
    array['fieldId','targetKind','targetType','projectionKey','cardinality','min','max','ordered','onUnavailable']::text[]
  ) or not platform_private.cms_valid_uuid(p_value->>'fieldId')
    or p_value->>'targetKind' not in ('content','domain')
    or p_value->>'targetType' !~ '^[a-z][a-z0-9._-]{0,95}$'
    or p_value->>'projectionKey' !~ '^[a-z][a-z0-9._-]{0,127}$'
    or not platform_private.cms_projection_registry_valid(
      p_value->>'targetKind', p_value->>'targetType', p_value->>'projectionKey'
    )
    or p_value->>'cardinality' not in ('one','many')
    or p_value->>'min' !~ '^[0-9]+$'
    or p_value->>'max' !~ '^[1-9][0-9]*$'
    or pg_catalog.jsonb_typeof(p_value->'ordered') <> 'boolean'
    or p_value->>'onUnavailable' not in ('omit','block','placeholder') then
    return false;
  end if;
  min_count := (p_value->>'min')::integer;
  max_count := (p_value->>'max')::integer;
  return min_count between 0 and 128
    and max_count between 1 and 128
    and min_count <= max_count
    and (
      (p_value->>'cardinality' = 'one' and max_count = 1 and min_count in (0,1))
      or p_value->>'cardinality' = 'many'
    );
exception when invalid_text_representation or numeric_value_out_of_range then
  return false;
end;
$body$;

create or replace function platform_private.cms_valid_block_request(p_request jsonb)
returns boolean
language plpgsql
stable
set search_path = ''
as $body$
declare
  snapshot jsonb := p_request->'propsSchemaSnapshot';
  attestation jsonb := p_request->'propsSnapshotAttestation';
  accessibility jsonb := coalesce(p_request->'accessibility', p_request->'accessibilityContract');
  compatibility jsonb := coalesce(p_request->'compatibility', p_request->'compatibilityRange');
begin
  if not platform_private.cms_exact_keys(
    p_request,
    array['blockKey','blockVersion','propsSchemaRef','propsSchemaHash','propsSchemaSnapshot','propsSnapshotHash','propsSnapshotAttestation','rendererRef','allowedChildren','slotRules','dataSourcePermissions','accessibility','compatibility','lifecycle','releaseDigest']::text[],
    array['blockKey','blockVersion','propsSchemaRef','propsSchemaHash','propsSchemaSnapshot','propsSnapshotHash','propsSnapshotAttestation','rendererRef','allowedChildren','slotRules','dataSourcePermissions','accessibility','accessibilityContract','compatibility','compatibilityRange','lifecycle','releaseDigest','idempotencyKey','context','correlationId','releaseKeyId','releaseNonce','releaseIssuedAt','releaseRawBodyHash','releaseSignature','releaseSignatureHash','releaseVerifiedAt']::text[]
  ) then return false; end if;
  if p_request->>'blockKey' !~ '^[a-z][a-z0-9._-]{0,95}$'
     or p_request->>'blockVersion' !~ '^[1-9][0-9]*$'
     or (p_request->>'blockVersion')::numeric > 2147483647
     or p_request->>'propsSchemaRef' !~ '^[a-z][a-z0-9._/-]{0,255}$'
     or position('..' in p_request->>'propsSchemaRef') > 0
     or position('//' in p_request->>'propsSchemaRef') > 0
     or not platform_private.cms_schema_ref_registry_valid(p_request->>'propsSchemaRef')
     or not platform_private.cms_valid_hash(p_request->>'propsSchemaHash')
     or not platform_private.cms_valid_hash(p_request->>'propsSnapshotHash')
     or not platform_private.cms_json_bounded(snapshot, 65536, 8, 128, 128)
     or platform_private.cms_jcs_sha256(snapshot) <> p_request->>'propsSnapshotHash'
     or p_request->>'lifecycle' <> 'supported'
     or not platform_private.cms_valid_hash(p_request->>'releaseDigest') then return false; end if;
  if pg_catalog.jsonb_typeof(snapshot) <> 'object'
     or not platform_private.cms_exact_keys(snapshot, array['schemaVersion','fields','additionalProperties']::text[], array['schemaVersion','fields','additionalProperties']::text[])
     or snapshot->>'schemaVersion' is null
     or pg_catalog.length(snapshot->>'schemaVersion') not between 1 and 32
     or pg_catalog.jsonb_typeof(snapshot->'fields') <> 'array'
     or pg_catalog.jsonb_array_length(snapshot->'fields') > 128
     or pg_catalog.jsonb_typeof(snapshot->'additionalProperties') <> 'boolean'
     or snapshot->>'additionalProperties' <> 'false' then return false; end if;
  if exists (select 1 from pg_catalog.jsonb_array_elements(snapshot->'fields') field_entry
    where not platform_private.cms_exact_keys(field_entry, array['name','kind','required']::text[], array['name','kind','required','constraints']::text[])
      or field_entry->>'name' !~ '^[a-z][a-z0-9_]{1,63}$'
      or pg_catalog.length(field_entry->>'kind') not between 1 and 64
      or pg_catalog.jsonb_typeof(field_entry->'required') <> 'boolean'
      or (field_entry ? 'constraints' and (
        pg_catalog.jsonb_typeof(field_entry->'constraints') <> 'object'
        or not platform_private.cms_json_bounded(field_entry->'constraints', 8192, 4, 64, 128)
      ))) then return false; end if;
  if not platform_private.cms_exact_keys(attestation, array['algorithm','keyId','signature']::text[], array['algorithm','keyId','signature']::text[])
     or attestation->>'algorithm' <> 'Ed25519'
     or attestation->>'keyId' !~ '^[a-z][a-z0-9_.-]{1,95}$'
     or not platform_private.cms_valid_base64(attestation->>'signature') then return false; end if;
  if p_request->>'rendererRef' !~ '^[a-z][a-z0-9._/-]{0,159}$'
     or position('..' in p_request->>'rendererRef') > 0
     or position('//' in p_request->>'rendererRef') > 0
     or not platform_private.cms_renderer_registry_valid(p_request->>'rendererRef')
     or pg_catalog.jsonb_typeof(p_request->'allowedChildren') <> 'array'
     or pg_catalog.jsonb_array_length(p_request->'allowedChildren') > 32 then return false; end if;
  if exists (select 1 from pg_catalog.jsonb_array_elements(p_request->'allowedChildren') child_entry
    where pg_catalog.jsonb_typeof(child_entry) <> 'string'
      or child_entry #>> '{}' !~ '^[a-z][a-z0-9._-]{0,95}$'
      or not platform_private.cms_block_key_registry_valid(child_entry #>> '{}', p_request->>'blockKey')) then return false; end if;
  if not platform_private.cms_exact_keys(p_request->'slotRules', array['maxDepth','maxNodes']::text[], array['maxDepth','maxNodes']::text[])
     or p_request->'slotRules'->>'maxDepth' !~ '^[1-9][0-9]*$'
     or p_request->'slotRules'->>'maxNodes' !~ '^[1-9][0-9]*$'
     or (p_request->'slotRules'->>'maxDepth')::integer not between 1 and 16
     or (p_request->'slotRules'->>'maxNodes')::integer not between 1 and 512 then return false; end if;
  if pg_catalog.jsonb_typeof(p_request->'dataSourcePermissions') <> 'array'
     or pg_catalog.jsonb_array_length(p_request->'dataSourcePermissions') > 32 then return false; end if;
  if exists (select 1 from pg_catalog.jsonb_array_elements(p_request->'dataSourcePermissions') source_entry
    where pg_catalog.jsonb_typeof(source_entry) <> 'string'
      or source_entry #>> '{}' !~ '^[a-z][a-z0-9._-]{0,127}$'
      or not platform_private.cms_data_source_registry_valid(source_entry #>> '{}')) then return false; end if;
  if not platform_private.cms_exact_keys(accessibility, array['nameRequired','keyboard','focusOrder','statusAnnouncement']::text[], array['nameRequired','keyboard','focusOrder','statusAnnouncement']::text[])
     or pg_catalog.jsonb_typeof(accessibility->'nameRequired') <> 'boolean'
     or accessibility->>'keyboard' <> 'true'
     or accessibility->>'focusOrder' not in ('document','managed')
     or pg_catalog.jsonb_typeof(accessibility->'statusAnnouncement') <> 'boolean' then return false; end if;
  if not platform_private.cms_exact_keys(compatibility, array['minSchemaCompiler','maxSchemaCompiler']::text[], array['minSchemaCompiler','maxSchemaCompiler']::text[])
     or pg_catalog.length(compatibility->>'minSchemaCompiler') not between 1 and 32
     or pg_catalog.length(compatibility->>'maxSchemaCompiler') not between 1 and 32
     or not platform_private.cms_compiler_registry_valid(compatibility->>'minSchemaCompiler')
     or not platform_private.cms_compiler_registry_valid(compatibility->>'maxSchemaCompiler') then return false; end if;
  return true;
exception when invalid_text_representation or numeric_value_out_of_range or invalid_parameter_value then
  return false;
end;
$body$;

create table platform_private.cms_content_types (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state text not null default 'retired',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type_key text not null,
  owner_capability text not null,
  built_in boolean not null default false,
  created_by uuid not null references auth.users(id),
  constraint cms_content_types_state_check check (state in ('active', 'retired')),
  constraint cms_content_types_type_key_check check (
    type_key = pg_catalog.btrim(type_key)
    and type_key ~ '^[a-z][a-z0-9_]{1,63}$'
  ),
  constraint cms_content_types_type_key_key unique (type_key),
  constraint cms_content_types_owner_capability_check check (
    pg_catalog.octet_length(owner_capability) between 1 and 128
    and owner_capability ~ '^[a-z][a-z0-9._-]{0,127}$'
  )
);

create table platform_private.cms_content_type_versions (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state platform_private.cms_definition_state not null default 'draft',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type_id uuid not null references platform_private.cms_content_types(id),
  version_no integer not null check (version_no > 0),
  labels jsonb not null,
  workflow_key text not null,
  workflow_version bigint not null check (workflow_version > 0),
  source_locale text not null,
  default_locale text not null,
  default_template_version_id uuid,
  schema_artifact_id uuid not null,
  definition_hash char(64) not null,
  compatibility text not null,
  supersedes_id uuid references platform_private.cms_content_type_versions(id),
  dry_run_id uuid,
  created_by uuid not null references auth.users(id),
  approved_at timestamptz,
  activation_workflow_policy_key text,
  activation_workflow_policy_version bigint,
  activation_workflow_policy_hash char(64),
  activation_required_decision_count smallint,
  activation_required_capabilities jsonb,
  activation_approval_evidence_hash char(64),
  constraint cms_content_type_versions_labels_check check (
    pg_catalog.jsonb_typeof(labels) = 'object'
    and platform_private.cms_json_bounded(labels)
  ),
  constraint cms_content_type_versions_workflow_key_check check (
    workflow_key ~ '^[a-z][a-z0-9._-]{0,127}$'
  ),
  constraint cms_content_type_versions_source_locale_check check (
    source_locale ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$'
  ),
  constraint cms_content_type_versions_default_locale_check check (
    default_locale ~ '^[A-Za-z]{2,8}(-[A-Za-z0-9]{1,8})*$'
  ),
  constraint cms_content_type_versions_definition_hash_check check (
    definition_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint cms_content_type_versions_compatibility_check check (
    compatibility in ('additive', 'conditional', 'breaking', 'unknown')
  ),
  constraint cms_content_type_versions_activation_policy_key_check check (
    activation_workflow_policy_key is null
    or activation_workflow_policy_key ~ '^[a-z][a-z0-9._-]{0,127}$'
  ),
  constraint cms_content_type_versions_activation_policy_version_check check (
    activation_workflow_policy_version is null or activation_workflow_policy_version > 0
  ),
  constraint cms_content_type_versions_activation_policy_hash_check check (
    activation_workflow_policy_hash is null or activation_workflow_policy_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint cms_content_type_versions_activation_decision_count_check check (
    activation_required_decision_count is null
    or activation_required_decision_count between 1 and 8
  ),
  constraint cms_content_type_versions_activation_capabilities_check check (
    activation_required_capabilities is null
    or (
      pg_catalog.jsonb_typeof(activation_required_capabilities) = 'array'
      and pg_catalog.jsonb_array_length(activation_required_capabilities) between 1 and 16
      and platform_private.cms_json_bounded(activation_required_capabilities)
    )
  ),
  constraint cms_content_type_versions_activation_evidence_complete_check check (
    (
      activation_workflow_policy_key is null
      and activation_workflow_policy_version is null
      and activation_workflow_policy_hash is null
      and activation_required_decision_count is null
      and activation_required_capabilities is null
      and activation_approval_evidence_hash is null
    )
    or (
      activation_workflow_policy_key is not null
      and activation_workflow_policy_version is not null
      and activation_workflow_policy_hash is not null
      and activation_required_decision_count is not null
      and activation_required_capabilities is not null
      and activation_approval_evidence_hash is not null
    )
  ),
  constraint cms_content_type_versions_activation_state_evidence_check check (
    state not in ('active', 'superseded', 'retired')
    or (
      activation_workflow_policy_key is not null
      and activation_workflow_policy_version is not null
      and activation_workflow_policy_hash is not null
      and activation_required_decision_count is not null
      and activation_required_capabilities is not null
      and activation_approval_evidence_hash is not null
    )
  ),
  constraint cms_content_type_versions_type_version_unique unique (content_type_id, version_no)
);

create table platform_private.cms_content_type_template_bindings (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state platform_private.cms_definition_state not null default 'draft',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type_version_id uuid not null references platform_private.cms_content_type_versions(id),
  template_version_id uuid not null,
  position integer not null check (position >= 0),
  constraint cms_content_type_template_bindings_unique unique (content_type_version_id, template_version_id)
);

create table platform_private.cms_content_type_capability_bindings (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state platform_private.cms_definition_state not null default 'draft',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type_version_id uuid not null references platform_private.cms_content_type_versions(id),
  capability_key text not null,
  capability_version bigint not null check (capability_version > 0),
  constraint cms_content_type_capability_bindings_key_check check (
    capability_key ~ '^[a-z][a-z0-9._-]{0,127}$'
  ),
  constraint cms_content_type_capability_bindings_unique unique (
    content_type_version_id, capability_key, capability_version
  )
);

create table platform_private.cms_field_definition_versions (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state text not null default 'active',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type_version_id uuid not null references platform_private.cms_content_type_versions(id),
  stable_field_id uuid not null,
  field_key text not null,
  kind text not null,
  constraints jsonb not null default '{}'::jsonb,
  validator_key text,
  validator_version bigint,
  required boolean not null default false,
  default_mode text not null default 'none',
  default_value jsonb,
  localization_mode text not null default 'none',
  editor_config jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id),
  constraint cms_field_definition_versions_state_check check (state in ('active', 'deprecated', 'retired')),
  constraint cms_field_definition_versions_field_key_check check (
    field_key ~ '^[a-z][a-z0-9_]{1,63}$'
  ),
  constraint cms_field_definition_versions_kind_check check (
    kind in (
      'short_text', 'long_text', 'rich_text', 'boolean', 'integer', 'decimal',
      'date', 'datetime', 'enum', 'taxonomy', 'relation', 'media', 'object', 'list'
    )
  ),
  constraint cms_field_definition_versions_constraints_check check (
    pg_catalog.jsonb_typeof(constraints) = 'object'
    and platform_private.cms_json_bounded(constraints, 8192, 4, 64, 256)
  ),
  constraint cms_field_definition_versions_validator_pair_check check (
    (validator_key is null) = (validator_version is null)
    and (validator_key is null or validator_key ~ '^[a-z][a-z0-9._-]{0,127}$')
    and (validator_version is null or validator_version > 0)
  ),
  constraint cms_field_definition_versions_default_check check (
    (default_mode = 'literal' and default_value is not null)
    or (default_mode in ('none', 'inherited') and default_value is null)
  ),
  constraint cms_field_definition_versions_default_value_bounds_check check (
    default_value is null
    or platform_private.cms_json_bounded(default_value, 262144, 8, 128, 128)
  ),
  constraint cms_field_definition_versions_default_mode_check check (
    default_mode in ('none', 'literal', 'inherited')
  ),
  constraint cms_field_definition_versions_localization_check check (
    localization_mode in ('none', 'localized', 'no_fallback')
  ),
  constraint cms_field_definition_versions_editor_config_check check (
    pg_catalog.jsonb_typeof(editor_config) = 'object'
    and platform_private.cms_json_bounded(editor_config, 8192, 4, 32, 32)
  ),
  constraint cms_field_definition_versions_stable_id_unique unique (
    content_type_version_id, stable_field_id
  ),
  constraint cms_field_definition_versions_type_key_unique unique (
    content_type_version_id, field_key
  )
);

create table platform_private.cms_relation_definitions (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state platform_private.cms_definition_state not null default 'draft',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  field_definition_id uuid not null references platform_private.cms_field_definition_versions(id),
  target_kind text not null,
  target_type text not null,
  projection_key text not null,
  cardinality text not null,
  min_count integer not null,
  max_count integer not null,
  ordered boolean not null default false,
  on_unavailable text not null,
  created_by uuid not null references auth.users(id),
  constraint cms_relation_definitions_target_kind_check check (target_kind in ('content', 'domain')),
  constraint cms_relation_definitions_target_type_check check (
    target_type ~ '^[a-z][a-z0-9._-]{0,95}$'
  ),
  constraint cms_relation_definitions_projection_key_check check (
    projection_key ~ '^[a-z][a-z0-9._-]{0,127}$'
  ),
  constraint cms_relation_definitions_cardinality_check check (cardinality in ('one', 'many')),
  constraint cms_relation_definitions_bounds_check check (
    min_count between 0 and 128 and max_count between 1 and 128 and min_count <= max_count
  ),
  constraint cms_relation_definitions_cardinality_bounds_check check (
    (cardinality = 'one' and max_count = 1 and min_count in (0, 1))
    or (cardinality = 'many' and min_count between 0 and 128 and max_count between 1 and 128)
  ),
  constraint cms_relation_definitions_on_unavailable_check check (
    on_unavailable in ('omit', 'block', 'placeholder')
  ),
  constraint cms_relation_definitions_field_unique unique (field_definition_id)
);

create table platform_private.cms_schema_migration_plans (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state text not null default 'draft',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type_id uuid not null references platform_private.cms_content_types(id),
  from_version_id uuid not null references platform_private.cms_content_type_versions(id),
  to_version_id uuid not null references platform_private.cms_content_type_versions(id),
  classification text not null,
  transform_key text,
  transform_version bigint,
  dry_run_report jsonb not null default '{}'::jsonb,
  cursor bigint not null default 0,
  progress numeric(9, 6) not null default 0,
  source_count bigint not null default 0,
  target_count bigint not null default 0,
  row_error_count bigint not null default 0,
  migrated_count bigint not null default 0,
  failed_count bigint not null default 0,
  created_by uuid references auth.users(id),
  started_at timestamptz,
  completed_at timestamptz,
  constraint cms_schema_migration_plans_state_check check (
    state in ('draft', 'dry_running', 'ready', 'blocked', 'running', 'verifying',
      'completed', 'failed_retryable', 'failed_terminal')
  ),
  constraint cms_schema_migration_plans_distinct_versions_check check (from_version_id <> to_version_id),
  constraint cms_schema_migration_plans_classification_check check (
    classification in ('additive', 'conditional', 'breaking')
    and (
      (classification = 'additive' and transform_key is null and transform_version is null)
      or (classification in ('conditional', 'breaking')
        and transform_key is not null and transform_version is not null)
    )
  ),
  constraint cms_schema_migration_plans_transform_key_check check (
    transform_key is null or transform_key ~ '^[a-z][a-z0-9._-]{0,127}$'
  ),
  constraint cms_schema_migration_plans_transform_version_check check (
    transform_version is null or transform_version > 0
  ),
  constraint cms_schema_migration_plans_report_check check (
    pg_catalog.jsonb_typeof(dry_run_report) = 'object'
    and platform_private.cms_json_bounded(dry_run_report)
  ),
  constraint cms_schema_migration_plans_counters_check check (
    cursor >= 0 and progress between 0 and 1
    and source_count >= 0 and target_count >= 0 and row_error_count >= 0
    and migrated_count >= 0 and failed_count >= 0
  ),
  constraint cms_schema_migration_plans_unique unique (from_version_id, to_version_id)
);

create table platform_private.cms_schema_artifacts (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state text not null default 'compiled',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  content_type_version_id uuid not null references platform_private.cms_content_type_versions(id),
  compiler_version text not null,
  zod_contract_ref text not null,
  editor_manifest jsonb not null,
  renderer_manifest jsonb not null,
  artifact_hash char(64) not null,
  compiled_at timestamptz not null,
  constraint cms_schema_artifacts_state_check check (state = 'compiled'),
  constraint cms_schema_artifacts_compiler_version_check check (pg_catalog.octet_length(compiler_version) between 1 and 32),
  constraint cms_schema_artifacts_contract_ref_check check (
    pg_catalog.octet_length(zod_contract_ref) between 1 and 256
    and position('..' in zod_contract_ref) = 0
    and position('//' in zod_contract_ref) = 0
  ),
  constraint cms_schema_artifacts_editor_manifest_check check (
    pg_catalog.jsonb_typeof(editor_manifest) = 'object'
    and platform_private.cms_compiled_manifest_bounded(editor_manifest)
  ),
  constraint cms_schema_artifacts_renderer_manifest_check check (
    pg_catalog.jsonb_typeof(renderer_manifest) = 'object'
    and platform_private.cms_compiled_manifest_bounded(renderer_manifest)
  ),
  constraint cms_schema_artifacts_hash_check check (artifact_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_schema_artifacts_created_immutable_check check (updated_at = created_at),
  constraint cms_schema_artifacts_version_unique unique (content_type_version_id),
  constraint cms_schema_artifacts_id_version_unique unique (id, content_type_version_id),
  constraint cms_schema_artifacts_hash_unique unique (artifact_hash)
);

-- Dry-run output is a separate immutable evidence authority.  The migration
-- plan remains the resumable worker record, while this row preserves the
-- producer's exact source/target/compiler/transform snapshot even as a plan's
-- lease and live-backfill counters advance.  First activation has no source
-- version, so its report is bound to the all-zero source fingerprint.
create table platform_private.cms_schema_dry_run_reports (
  id uuid not null primary key,
  owner_id uuid not null,
  content_type_id uuid not null references platform_private.cms_content_types(id),
  source_version_id uuid references platform_private.cms_content_type_versions(id),
  target_version_id uuid not null references platform_private.cms_content_type_versions(id),
  classification text not null,
  transform_key text,
  transform_version bigint,
  source_hash char(64) not null,
  target_hash char(64) not null,
  compiler_hash char(64) not null,
  compiler_version text not null,
  source_count bigint not null,
  target_count bigint not null,
  row_error_count bigint not null,
  migrated_count bigint not null,
  failed_count bigint not null,
  result text not null default 'pass',
  report jsonb not null,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  constraint cms_schema_dry_run_reports_target_distinct_check check (id <> target_version_id),
  constraint cms_schema_dry_run_reports_classification_check check (
    classification in ('additive', 'conditional', 'breaking')
    and (
      (classification = 'additive' and transform_key is null and transform_version is null)
      or (classification in ('conditional', 'breaking')
        and transform_key is not null and transform_version is not null)
    )
  ),
  constraint cms_schema_dry_run_reports_transform_key_check check (
    transform_key is null or transform_key ~ '^[a-z][a-z0-9._-]{0,127}$'
  ),
  constraint cms_schema_dry_run_reports_transform_version_check check (
    transform_version is null or transform_version > 0
  ),
  constraint cms_schema_dry_run_reports_hash_check check (
    source_hash ~ '^[a-f0-9]{64}$'
    and target_hash ~ '^[a-f0-9]{64}$'
    and compiler_hash ~ '^[a-f0-9]{64}$'
  ),
  constraint cms_schema_dry_run_reports_count_check check (
    source_count >= 0 and target_count >= 0 and row_error_count >= 0
    and migrated_count >= 0 and failed_count >= 0
  ),
  constraint cms_schema_dry_run_reports_result_check check (result = 'pass'),
  constraint cms_schema_dry_run_reports_report_check check (
    pg_catalog.jsonb_typeof(report) = 'object'
    and platform_private.cms_json_bounded(report)
    and report->>'dryRunId' = id::text
    and report->>'result' = result
    and report->>'sourceCount' = source_count::text
    and report->>'targetCount' = target_count::text
    and report->>'rowErrorCount' = row_error_count::text
    and report->>'migratedCount' = migrated_count::text
    and report->>'failedCount' = failed_count::text
  )
);

create index cms_schema_dry_run_reports_target_created_idx
  on platform_private.cms_schema_dry_run_reports (target_version_id, created_at desc);

create table platform_private.cms_block_definition_versions (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state text not null default 'registered',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  block_key text not null,
  block_version integer not null,
  props_schema_ref text not null,
  props_schema_hash char(64) not null,
  props_schema_snapshot jsonb not null,
  props_snapshot_hash char(64) not null,
  props_snapshot_attestation jsonb not null,
  props_attestation_key_id text not null,
  props_attestation_signature_hash char(64) not null,
  props_attestation_verified_at timestamptz not null,
  renderer_ref text not null,
  allowed_children jsonb not null,
  slot_rules jsonb not null,
  data_source_permissions jsonb not null,
  accessibility_contract jsonb not null,
  compatibility_range jsonb not null,
  release_digest char(64) not null,
  release_principal_id uuid not null,
  release_key_id text not null,
  release_raw_body_hash char(64) not null,
  release_signature_hash char(64) not null,
  release_nonce_hash char(64) not null,
  release_verified_at timestamptz not null,
  constraint cms_block_definition_versions_state_check check (state = 'registered'),
  constraint cms_block_definition_versions_key_check check (
    block_key ~ '^[a-z][a-z0-9._-]{0,95}$'
  ),
  constraint cms_block_definition_versions_block_version_check check (block_version > 0),
  constraint cms_block_definition_versions_props_ref_check check (
    pg_catalog.octet_length(props_schema_ref) between 1 and 256
    and position('..' in props_schema_ref) = 0
    and position('//' in props_schema_ref) = 0
  ),
  constraint cms_block_definition_versions_props_schema_hash_check check (props_schema_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_versions_props_snapshot_check check (
    pg_catalog.jsonb_typeof(props_schema_snapshot) = 'object'
    and platform_private.cms_json_bounded(props_schema_snapshot)
  ),
  constraint cms_block_definition_versions_snapshot_hash_check check (props_snapshot_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_versions_attestation_check check (
    pg_catalog.jsonb_typeof(props_snapshot_attestation) = 'object'
    and platform_private.cms_json_bounded(props_snapshot_attestation, 8192, 4, 16, 32)
  ),
  constraint cms_block_definition_versions_attestation_key_check check (props_attestation_key_id ~ '^[a-z][a-z0-9_.-]{1,95}$'),
  constraint cms_block_definition_versions_attestation_signature_check check (props_attestation_signature_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_versions_renderer_check check (pg_catalog.octet_length(renderer_ref) between 1 and 160),
  constraint cms_block_definition_versions_allowed_children_check check (
    pg_catalog.jsonb_typeof(allowed_children) = 'array'
    and pg_catalog.jsonb_array_length(allowed_children) <= 32
    and platform_private.cms_json_bounded(allowed_children)
  ),
  constraint cms_block_definition_versions_slot_rules_check check (
    pg_catalog.jsonb_typeof(slot_rules) = 'object'
    and platform_private.cms_json_bounded(slot_rules, 8192, 4, 32, 32)
  ),
  constraint cms_block_definition_versions_data_sources_check check (
    pg_catalog.jsonb_typeof(data_source_permissions) = 'array'
    and pg_catalog.jsonb_array_length(data_source_permissions) <= 32
    and platform_private.cms_json_bounded(data_source_permissions)
  ),
  constraint cms_block_definition_versions_accessibility_check check (
    pg_catalog.jsonb_typeof(accessibility_contract) = 'object'
    and platform_private.cms_json_bounded(accessibility_contract)
  ),
  constraint cms_block_definition_versions_compatibility_check check (
    pg_catalog.jsonb_typeof(compatibility_range) = 'object'
    and platform_private.cms_json_bounded(compatibility_range)
  ),
  constraint cms_block_definition_versions_release_digest_check check (release_digest ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_versions_release_key_check check (release_key_id ~ '^[a-z][a-z0-9_.-]{1,95}$'),
  constraint cms_block_definition_versions_release_raw_hash_check check (release_raw_body_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_versions_release_signature_check check (release_signature_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_versions_release_nonce_check check (release_nonce_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_versions_created_immutable_check check (updated_at = created_at),
  constraint cms_block_definition_versions_key_version_unique unique (block_key, block_version)
);

create table platform_private.cms_release_nonce_receipts (
  id uuid not null default extensions.gen_random_uuid() primary key,
  release_key_id text not null,
  nonce_hash char(64) not null,
  operation_id text not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  raw_body_hash char(64) not null,
  signature_hash char(64) not null,
  verified_at timestamptz not null,
  outcome text not null default 'claimed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cms_release_nonce_receipts_key_check check (release_key_id ~ '^[a-z][a-z0-9_.-]{1,95}$'),
  constraint cms_release_nonce_receipts_nonce_hash_check check (nonce_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_release_nonce_receipts_operation_check check (operation_id in ('CMS-03A-05', 'CMS-03A-08')),
  constraint cms_release_nonce_receipts_raw_hash_check check (raw_body_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_release_nonce_receipts_signature_hash_check check (signature_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_release_nonce_receipts_outcome_check check (outcome in ('claimed', 'consumed', 'rejected')),
  constraint cms_release_nonce_receipts_ttl_check check (expires_at >= issued_at + interval '10 minutes'),
  constraint cms_release_nonce_receipts_key_nonce_unique unique (release_key_id, nonce_hash)
);

create table platform_private.cms_block_definition_lifecycle_events (
  id uuid not null default extensions.gen_random_uuid() primary key,
  owner_id uuid not null,
  state text not null default 'recorded',
  version bigint not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  block_definition_version_id uuid not null references platform_private.cms_block_definition_versions(id),
  block_key text not null,
  block_version integer not null,
  from_lifecycle text not null,
  to_lifecycle text not null,
  release_digest char(64) not null,
  release_principal_id uuid not null,
  release_key_id text not null,
  release_raw_body_hash char(64) not null,
  release_signature_hash char(64) not null,
  release_nonce_hash char(64) not null,
  release_verified_at timestamptz not null,
  constraint cms_block_definition_lifecycle_events_state_check check (state = 'recorded'),
  constraint cms_block_definition_lifecycle_events_key_check check (
    block_key ~ '^[a-z][a-z0-9._-]{0,95}$'
  ),
  constraint cms_block_definition_lifecycle_events_block_version_check check (block_version > 0),
  constraint cms_block_definition_lifecycle_events_from_check check (from_lifecycle in ('supported', 'deprecated')),
  constraint cms_block_definition_lifecycle_events_to_check check (to_lifecycle in ('deprecated', 'withdrawn')),
  constraint cms_block_definition_lifecycle_events_release_digest_check check (release_digest ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_lifecycle_events_release_key_check check (release_key_id ~ '^[a-z][a-z0-9_.-]{1,95}$'),
  constraint cms_block_definition_lifecycle_events_release_raw_hash_check check (release_raw_body_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_lifecycle_events_release_signature_check check (release_signature_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_lifecycle_events_release_nonce_check check (release_nonce_hash ~ '^[a-f0-9]{64}$'),
  constraint cms_block_definition_lifecycle_events_transition_check check (
    (from_lifecycle = 'supported' and to_lifecycle = 'deprecated')
    or (from_lifecycle = 'deprecated' and to_lifecycle = 'withdrawn')
  ),
  constraint cms_block_definition_lifecycle_events_created_immutable_check check (updated_at = created_at),
  constraint cms_block_definition_lifecycle_events_transition_unique unique (
    block_definition_version_id, to_lifecycle
  ),
  constraint cms_block_definition_lifecycle_events_key_transition_unique unique (
    block_key, block_version, to_lifecycle
  )
);

alter table platform_private.cms_content_type_versions
  add constraint cms_content_type_versions_artifact_pair_fkey
  foreign key (schema_artifact_id, id)
  references platform_private.cms_schema_artifacts(id, content_type_version_id)
  deferrable initially deferred;

create unique index cms_content_type_versions_one_active_unique
  on platform_private.cms_content_type_versions (content_type_id)
  where state = 'active';
create index cms_content_types_owner_state_idx
  on platform_private.cms_content_types (owner_capability, state);
create index cms_content_types_owner_updated_idx
  on platform_private.cms_content_types (owner_id, updated_at desc);
create index cms_content_type_versions_content_state_version_idx
  on platform_private.cms_content_type_versions (content_type_id, state, version_no desc);
create index cms_content_type_versions_owner_updated_idx
  on platform_private.cms_content_type_versions (owner_id, updated_at);
create index cms_content_type_template_bindings_parent_position_idx
  on platform_private.cms_content_type_template_bindings (content_type_version_id, position);
create index cms_content_type_capability_bindings_key_idx
  on platform_private.cms_content_type_capability_bindings (capability_key, capability_version);
create index cms_field_definition_versions_parent_state_idx
  on platform_private.cms_field_definition_versions (content_type_version_id, state);
create index cms_field_definition_versions_stable_id_idx
  on platform_private.cms_field_definition_versions (stable_field_id);
create index cms_relation_definitions_target_projection_idx
  on platform_private.cms_relation_definitions (target_kind, target_type, projection_key);
create index cms_relation_definitions_field_version_idx
  on platform_private.cms_relation_definitions (field_definition_id, version desc);
create index cms_schema_migration_plans_worker_lease_idx
  on platform_private.cms_schema_migration_plans (state, updated_at);
create index cms_schema_migration_plans_type_state_idx
  on platform_private.cms_schema_migration_plans (content_type_id, state, updated_at);
create index cms_schema_artifacts_owner_created_idx
  on platform_private.cms_schema_artifacts (owner_id, created_at desc);
create index cms_block_definition_versions_key_state_version_idx
  on platform_private.cms_block_definition_versions (block_key, state, block_version desc);
create index cms_block_definition_versions_release_digest_idx
  on platform_private.cms_block_definition_versions (release_digest);
create index cms_release_nonce_receipts_expiry_idx
  on platform_private.cms_release_nonce_receipts (expires_at);
create index cms_block_definition_lifecycle_events_parent_created_idx
  on platform_private.cms_block_definition_lifecycle_events (block_definition_version_id, created_at desc);

-- The table-backed portion of the protected child-block registry is installed
-- after the twelve canonical tables exist.  The earlier definition keeps the
-- validator function creatable before the table DDL; this replacement is the
-- effective definition for all RPC calls below.
create or replace function platform_private.cms_block_key_registry_valid(
  p_key text,
  p_current_key text default null
)
returns boolean
language sql
stable
set search_path = ''
as $body$
  select coalesce(p_key = p_current_key, false)
    or p_key in ('hero', 'hero-banner', 'cms.hero', 'cms.hero.banner')
    or exists (
      select 1
      from platform_private.cms_block_definition_versions block_row
      where block_row.block_key = p_key
    )
$body$;

create or replace function platform_private.cms_rpc_context_valid()
returns boolean
language sql
stable
security definer
set search_path = ''
as $body$
  select pg_catalog.current_setting('app.cms_rpc', true) = 'true'
$body$;

create or replace function platform_private.cms_write_guard()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  if pg_catalog.current_setting('app.cms_rpc', true) is distinct from 'true' then
    raise exception 'DIRECT_CMS_TABLE_WRITE' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$body$;

create or replace function platform_private.cms_immutable_guard()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
end;
$body$;

-- A completed migration is the immutable hand-off evidence consumed by
-- activation.  The worker RPCs may advance a draft/ready/verifying plan, but
-- no path (including a trusted SQL session with app.cms_rpc enabled) may edit
-- or delete the terminal report after completion.
create or replace function platform_private.cms_completed_migration_plan_guard()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  if old.state = 'completed' then
    raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$body$;

create or replace function platform_private.cms_content_type_identity_guard()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  if new.type_key is distinct from old.type_key
     or new.built_in is distinct from old.built_in
     or new.created_by is distinct from old.created_by then
    raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create or replace function platform_private.cms_content_version_guard()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  if old.state in (
    'active'::platform_private.cms_definition_state,
    'superseded'::platform_private.cms_definition_state,
    'retired'::platform_private.cms_definition_state
  ) then
    if old.state = 'active'::platform_private.cms_definition_state
       and new.state = 'superseded'::platform_private.cms_definition_state
       and new.version = old.version + 1
       and new.owner_id = old.owner_id
       and new.created_at = old.created_at
       and new.content_type_id = old.content_type_id
       and new.version_no = old.version_no
       and new.labels = old.labels
       and new.workflow_key = old.workflow_key
       and new.workflow_version = old.workflow_version
       and new.source_locale = old.source_locale
       and new.default_locale = old.default_locale
       and new.default_template_version_id is not distinct from old.default_template_version_id
       and new.schema_artifact_id = old.schema_artifact_id
       and new.definition_hash = old.definition_hash
       and new.compatibility = old.compatibility
       and new.supersedes_id is not distinct from old.supersedes_id
       and new.dry_run_id is not distinct from old.dry_run_id
       and new.created_by = old.created_by
       and new.approved_at is not distinct from old.approved_at
       and new.activation_workflow_policy_key is not distinct from old.activation_workflow_policy_key
       and new.activation_workflow_policy_version is not distinct from old.activation_workflow_policy_version
       and new.activation_workflow_policy_hash is not distinct from old.activation_workflow_policy_hash
       and new.activation_required_decision_count is not distinct from old.activation_required_decision_count
       and new.activation_required_capabilities is not distinct from old.activation_required_capabilities
       and new.activation_approval_evidence_hash is not distinct from old.activation_approval_evidence_hash
    then
      return new;
    end if;
    raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
  end if;
  if new.content_type_id is distinct from old.content_type_id
     or new.version_no is distinct from old.version_no
     or new.created_by is distinct from old.created_by
     or new.schema_artifact_id is distinct from old.schema_artifact_id then
    raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create or replace function platform_private.cms_field_identity_guard()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  if new.content_type_version_id is distinct from old.content_type_version_id
     or new.stable_field_id is distinct from old.stable_field_id
     or new.field_key is distinct from old.field_key
     or new.created_by is distinct from old.created_by then
    raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

-- Definition children are mutable only while their parent version is a draft
-- or in review.  Once a version can be read as active (including its
-- superseded/retired history), changing a child would make the approved
-- artifact and its review evidence describe a different graph.  The parent
-- row is locked before the check so an edit racing activation linearizes with
-- the activation transaction instead of slipping between its reads.
create or replace function platform_private.cms_active_parent_guard()
returns trigger
language plpgsql
set search_path = ''
as $body$
declare
  parent_version_id uuid;
  parent_state text;
begin
  if tg_table_name in (
    'cms_content_type_template_bindings',
    'cms_content_type_capability_bindings',
    'cms_field_definition_versions'
  ) then
    -- A move has two parents.  Lock every affected parent in UUID order so a
    -- concurrent move cannot acquire the same graph rows in the opposite
    -- order.  The guard then checks each locked snapshot before the child is
    -- allowed to change.
    for parent_version_id in
      select parent_id
      from (
        values
          (case when tg_op = 'DELETE'
             then old.content_type_version_id else new.content_type_version_id end),
          (case when tg_op = 'UPDATE'
                  and old.content_type_version_id is distinct from new.content_type_version_id
             then old.content_type_version_id else null::uuid end)
      ) parents(parent_id)
      where parent_id is not null
      order by parent_id
    loop
      select version_row.state::text into parent_state
        from platform_private.cms_content_type_versions version_row
       where version_row.id = parent_version_id
       order by version_row.id
       for update;
      if parent_state in ('active', 'superseded', 'retired') then
        raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
      end if;
    end loop;
  elsif tg_table_name = 'cms_relation_definitions' then
    -- Resolve both field parents before locking them.  Sorting the parent IDs
    -- gives relation moves the same graph lock order as activation.
    select field.content_type_version_id into parent_version_id
      from platform_private.cms_field_definition_versions field
     where field.id = case when tg_op = 'DELETE'
       then old.field_definition_id else new.field_definition_id end;
    if tg_op = 'UPDATE'
       and new.field_definition_id is distinct from old.field_definition_id then
      for parent_version_id in
        select parent_id
        from (
          values
            (parent_version_id),
            ((select field.content_type_version_id
                from platform_private.cms_field_definition_versions field
               where field.id = old.field_definition_id))
        ) parents(parent_id)
        where parent_id is not null
        group by parent_id
        order by parent_id
      loop
        select version_row.state::text into parent_state
          from platform_private.cms_content_type_versions version_row
         where version_row.id = parent_version_id
         order by version_row.id
         for update;
        if parent_state in ('active', 'superseded', 'retired') then
          raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
        end if;
      end loop;
    else
      select version_row.state::text into parent_state
        from platform_private.cms_content_type_versions version_row
       where version_row.id = parent_version_id
       order by version_row.id
       for update;
      if parent_state in ('active', 'superseded', 'retired') then
        raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
      end if;
    end if;
  end if;
  return coalesce(new, old);
end;
$body$;

create or replace function platform_private.cms_nonce_guard()
returns trigger
language plpgsql
set search_path = ''
as $body$
begin
  if new.release_key_id is distinct from old.release_key_id
     or new.nonce_hash is distinct from old.nonce_hash
     or new.operation_id is distinct from old.operation_id
     or new.issued_at is distinct from old.issued_at
     or new.expires_at is distinct from old.expires_at
     or new.raw_body_hash is distinct from old.raw_body_hash
     or new.signature_hash is distinct from old.signature_hash
     or new.verified_at is distinct from old.verified_at
     or (old.outcome = 'consumed' and (new.outcome is distinct from old.outcome or new.consumed_at is distinct from old.consumed_at))
     or (new.outcome = 'consumed' and new.consumed_at is null) then
    raise exception 'IMMUTABLE_RECORD' using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

-- Approval rows are append-only, so invalidation moves the review back to
-- review and makes every old approval unusable without deleting evidence.
-- All callers (including trusted RPCs) therefore have to collect a fresh
-- approval set after a candidate or one of its authorities changes.
create or replace function platform_private.cms_invalidate_activation_reviews(
  p_candidate_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $body$
declare
  invalidated_count integer;
begin
  perform pg_catalog.set_config('app.cfg_rpc', 'true', true);
  -- Materialize the ordered review IDs before the update.  Invalidation is
  -- reached by graph and authority writers, so every caller must acquire
  -- review locks in the same order before changing their version numbers.
  with locked_reviews as materialized (
    select review.id
      from platform_private.cfg_config_change_reviews review
     where review.candidate_type = 'setting_value'
       and review.candidate_id = p_candidate_id
       and review.state in ('approved', 'scheduled')
     order by review.id
     for update
  )
  update platform_private.cfg_config_change_reviews review
     set state = 'review',
         version_no = review.version_no + 1,
         updated_at = pg_catalog.clock_timestamp()
    from locked_reviews
   where review.id = locked_reviews.id;
  get diagnostics invalidated_count = row_count;
  return invalidated_count;
end;
$body$;

create or replace function platform_private.cms_invalidate_activation_reviews_for_owner(
  p_owner_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $body$
declare
  invalidated_count integer;
begin
  if p_owner_id is null then
    return 0;
  end if;
  perform pg_catalog.set_config('app.cfg_rpc', 'true', true);
  with locked_reviews as materialized (
    select review.id
      from platform_private.cfg_config_change_reviews review
     where review.candidate_type = 'setting_value'
       and review.state in ('approved', 'scheduled')
       and exists (
         select 1
           from platform_private.cms_content_type_versions version_row
          where version_row.id = review.candidate_id
            and version_row.owner_id = p_owner_id
       )
     order by review.id
     for update
  )
  update platform_private.cfg_config_change_reviews review
     set state = 'review',
         version_no = review.version_no + 1,
         updated_at = pg_catalog.clock_timestamp()
    from locked_reviews
   where review.id = locked_reviews.id;
  get diagnostics invalidated_count = row_count;
  return invalidated_count;
end;
$body$;

create or replace function platform_private.cms_activation_review_invalidation_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $body$
declare
  version_id uuid;
  old_version_id uuid;
  new_version_id uuid;
  reference_key text;
  reference_version integer;
begin
  if tg_table_name = 'cms_content_type_versions' then
    if tg_op = 'UPDATE'
       and new.state::text in ('active', 'superseded', 'retired') then
      return new;
    end if;
    if tg_op = 'UPDATE'
       and old.state::text not in ('review', 'approved', 'scheduled') then
      return new;
    end if;
    version_id := case when tg_op = 'DELETE' then old.id else new.id end;
    perform platform_private.cms_invalidate_activation_reviews(version_id);
    return coalesce(new, old);
  elsif tg_table_name = 'cms_content_types' then
    if tg_op = 'UPDATE'
       and new.owner_id is not distinct from old.owner_id
       and new.owner_capability is not distinct from old.owner_capability then
      return new;
    end if;
    -- Owner/capability moves have the same two-sided scope as child moves;
    -- sort both organization IDs before taking their review locks.
    for version_id in
      select owner_id
        from (
          values
            (case when tg_op = 'DELETE' then old.owner_id else new.owner_id end),
            (case when tg_op = 'UPDATE' and old.owner_id is distinct from new.owner_id
                  then old.owner_id else null::uuid end)
        ) owners(owner_id)
       where owner_id is not null
       group by owner_id
       order by owner_id
    loop
      perform platform_private.cms_invalidate_activation_reviews_for_owner(version_id);
    end loop;
    return coalesce(new, old);
  elsif tg_table_name in (
    'cms_content_type_template_bindings',
    'cms_content_type_capability_bindings',
    'cms_field_definition_versions'
  ) then
    old_version_id := case when tg_op = 'INSERT' then null else old.content_type_version_id end;
    new_version_id := case when tg_op = 'DELETE' then null else new.content_type_version_id end;
    -- A moved child invalidates both parent candidates.  Sort the IDs so the
    -- two helper calls cannot invert review-lock acquisition across sessions.
    for version_id in
      select parent_id
        from (
          values (new_version_id), (old_version_id)
        ) parents(parent_id)
       where parent_id is not null
       group by parent_id
       order by parent_id
    loop
      perform platform_private.cms_invalidate_activation_reviews(version_id);
    end loop;
    return coalesce(new, old);
  elsif tg_table_name = 'cms_relation_definitions' then
    if tg_op <> 'INSERT' then
      select field.content_type_version_id
        into old_version_id
        from platform_private.cms_field_definition_versions field
       where field.id = old.field_definition_id;
    end if;
    if tg_op <> 'DELETE' then
      select field.content_type_version_id
        into new_version_id
        from platform_private.cms_field_definition_versions field
       where field.id = new.field_definition_id;
    end if;
    for version_id in
      select parent_id
        from (
          values (new_version_id), (old_version_id)
        ) parents(parent_id)
       where parent_id is not null
       group by parent_id
       order by parent_id
    loop
      perform platform_private.cms_invalidate_activation_reviews(version_id);
    end loop;
    return coalesce(new, old);
  elsif tg_table_name in ('organization_actor_grant', 'membership_tenure') then
    for version_id in
      select owner_id
        from (
          values
            (case when tg_op <> 'INSERT' then old.organization_id else null::uuid end),
            (case when tg_op <> 'DELETE'
                    and (tg_op <> 'UPDATE' or new.organization_id is distinct from old.organization_id)
                  then new.organization_id else null::uuid end)
        ) owners(owner_id)
       where owner_id is not null
       group by owner_id
       order by owner_id
    loop
      perform platform_private.cms_invalidate_activation_reviews_for_owner(version_id);
    end loop;
    return coalesce(new, old);
  elsif tg_table_name = 'cms_block_definition_lifecycle_events' then
    -- Block lifecycle is a code-owned reference authority.  Its rows do not
    -- carry a CMS content-type owner, so use the immutable renderer manifest
    -- to invalidate only candidates that actually reference this block key.
    reference_key := case when tg_op = 'DELETE' then old.block_key else new.block_key end;
    reference_version := case when tg_op = 'DELETE' then old.block_version else new.block_version end;
    perform pg_catalog.set_config('app.cfg_rpc', 'true', true);
    with locked_reviews as materialized (
      select review.id
        from platform_private.cfg_config_change_reviews review
       where review.candidate_type = 'setting_value'
         and review.state in ('approved', 'scheduled')
         and exists (
           select 1
             from platform_private.cms_content_type_versions version_row
             join platform_private.cms_schema_artifacts artifact
               on artifact.id = version_row.schema_artifact_id
              and artifact.content_type_version_id = version_row.id
            where version_row.id = review.candidate_id
              and (
                exists (
                  select 1
                    from pg_catalog.jsonb_array_elements(
                      coalesce(artifact.renderer_manifest->'blocks', '[]'::jsonb)
                    ) entry(value)
                   where pg_catalog.jsonb_typeof(entry.value) = 'object'
                     and entry.value->>'blockKey' = reference_key
                     and entry.value->>'blockVersion' = reference_version::text
                )
                or exists (
                  select 1
                    from pg_catalog.jsonb_array_elements(
                      coalesce(artifact.renderer_manifest->'blockDefinitions', '[]'::jsonb)
                    ) entry(value)
                   where pg_catalog.jsonb_typeof(entry.value) = 'object'
                     and entry.value->>'blockKey' = reference_key
                     and entry.value->>'blockVersion' = reference_version::text
                )
              )
         )
       order by review.id
       for update
    )
    update platform_private.cfg_config_change_reviews review
       set state = 'review',
           version_no = review.version_no + 1,
           updated_at = pg_catalog.clock_timestamp()
      from locked_reviews
     where review.id = locked_reviews.id;
    return coalesce(new, old);
  end if;
  return coalesce(new, old);
end;
$body$;

create trigger cms_content_types_write_guard
before insert or update or delete on platform_private.cms_content_types
for each row execute function platform_private.cms_write_guard();
create trigger cms_content_types_identity_guard
before update on platform_private.cms_content_types
for each row execute function platform_private.cms_content_type_identity_guard();
create trigger cms_content_type_versions_write_guard
before insert or update or delete on platform_private.cms_content_type_versions
for each row execute function platform_private.cms_write_guard();
create trigger cms_content_type_versions_guard
before update on platform_private.cms_content_type_versions
for each row execute function platform_private.cms_content_version_guard();
create trigger cms_content_types_activation_review_invalidation
after update on platform_private.cms_content_types
for each row execute function platform_private.cms_activation_review_invalidation_trigger();
create trigger cms_content_type_versions_activation_review_invalidation
after insert or update or delete on platform_private.cms_content_type_versions
for each row execute function platform_private.cms_activation_review_invalidation_trigger();
create trigger cms_content_type_template_bindings_write_guard
before insert or update or delete on platform_private.cms_content_type_template_bindings
for each row execute function platform_private.cms_write_guard();
create trigger cms_content_type_template_bindings_parent_state_guard
before insert or update or delete on platform_private.cms_content_type_template_bindings
for each row execute function platform_private.cms_active_parent_guard();
create trigger cms_content_type_template_bindings_activation_review_invalidation
after insert or update or delete on platform_private.cms_content_type_template_bindings
for each row execute function platform_private.cms_activation_review_invalidation_trigger();
create trigger cms_content_type_capability_bindings_write_guard
before insert or update or delete on platform_private.cms_content_type_capability_bindings
for each row execute function platform_private.cms_write_guard();
create trigger cms_content_type_capability_bindings_parent_state_guard
before insert or update or delete on platform_private.cms_content_type_capability_bindings
for each row execute function platform_private.cms_active_parent_guard();
create trigger cms_content_type_capability_bindings_activation_review_invalidation
after insert or update or delete on platform_private.cms_content_type_capability_bindings
for each row execute function platform_private.cms_activation_review_invalidation_trigger();
create trigger cms_field_definition_versions_write_guard
before insert or update or delete on platform_private.cms_field_definition_versions
for each row execute function platform_private.cms_write_guard();
create trigger cms_field_definition_versions_identity_guard
before update on platform_private.cms_field_definition_versions
for each row execute function platform_private.cms_field_identity_guard();
create trigger cms_field_definition_versions_parent_state_guard
before insert or update or delete on platform_private.cms_field_definition_versions
for each row execute function platform_private.cms_active_parent_guard();
create trigger cms_field_definition_versions_activation_review_invalidation
after insert or update or delete on platform_private.cms_field_definition_versions
for each row execute function platform_private.cms_activation_review_invalidation_trigger();
create trigger cms_relation_definitions_write_guard
before insert or update or delete on platform_private.cms_relation_definitions
for each row execute function platform_private.cms_write_guard();
create trigger cms_relation_definitions_parent_state_guard
before insert or update or delete on platform_private.cms_relation_definitions
for each row execute function platform_private.cms_active_parent_guard();
create trigger cms_relation_definitions_activation_review_invalidation
after insert or update or delete on platform_private.cms_relation_definitions
for each row execute function platform_private.cms_activation_review_invalidation_trigger();
create trigger cms_schema_migration_plans_write_guard
before insert or update or delete on platform_private.cms_schema_migration_plans
for each row execute function platform_private.cms_write_guard();
-- Keep this trigger after the generic write guard by name so an unauthorised
-- direct write still reports DIRECT_CMS_TABLE_WRITE before terminal-state
-- immutability is evaluated.
create trigger cms_schema_migration_plans_z_completed_guard
before update or delete on platform_private.cms_schema_migration_plans
for each row execute function platform_private.cms_completed_migration_plan_guard();
create trigger cms_schema_artifacts_write_guard
before insert on platform_private.cms_schema_artifacts
for each row execute function platform_private.cms_write_guard();
create trigger cms_schema_artifacts_immutable_guard
before update or delete on platform_private.cms_schema_artifacts
for each row execute function platform_private.cms_immutable_guard();
create trigger cms_schema_dry_run_reports_write_guard
before insert on platform_private.cms_schema_dry_run_reports
for each row execute function platform_private.cms_write_guard();
create trigger cms_schema_dry_run_reports_immutable_guard
before update or delete on platform_private.cms_schema_dry_run_reports
for each row execute function platform_private.cms_immutable_guard();
create trigger cms_block_definition_versions_write_guard
before insert on platform_private.cms_block_definition_versions
for each row execute function platform_private.cms_write_guard();
create trigger cms_block_definition_versions_immutable_guard
before update or delete on platform_private.cms_block_definition_versions
for each row execute function platform_private.cms_immutable_guard();
create trigger cms_release_nonce_receipts_write_guard
before insert or update or delete on platform_private.cms_release_nonce_receipts
for each row execute function platform_private.cms_write_guard();
create trigger cms_release_nonce_receipts_immutable_guard
before delete on platform_private.cms_release_nonce_receipts
for each row execute function platform_private.cms_immutable_guard();
create trigger cms_release_nonce_receipts_identity_guard
before update on platform_private.cms_release_nonce_receipts
for each row execute function platform_private.cms_nonce_guard();
create trigger cms_block_definition_lifecycle_events_write_guard
before insert on platform_private.cms_block_definition_lifecycle_events
for each row execute function platform_private.cms_write_guard();
create trigger cms_block_definition_lifecycle_events_immutable_guard
before update or delete on platform_private.cms_block_definition_lifecycle_events
for each row execute function platform_private.cms_immutable_guard();
create trigger cms_block_definition_lifecycle_events_activation_review_invalidation
after insert on platform_private.cms_block_definition_lifecycle_events
for each row execute function platform_private.cms_activation_review_invalidation_trigger();

do $body$
declare
  table_name text;
begin
  foreach table_name in array array[
    'cms_content_types', 'cms_content_type_versions',
    'cms_content_type_template_bindings', 'cms_content_type_capability_bindings',
    'cms_field_definition_versions', 'cms_relation_definitions',
    'cms_schema_migration_plans', 'cms_schema_artifacts',
    'cms_schema_dry_run_reports',
    'cms_block_definition_versions', 'cms_release_nonce_receipts',
    'cms_block_definition_lifecycle_events'
  ] loop
    execute format('alter table platform_private.%I enable row level security', table_name);
    execute format('alter table platform_private.%I force row level security', table_name);
    execute format('revoke all on table platform_private.%I from public, anon, authenticated, service_role', table_name);
    execute format('create policy %I on platform_private.%I for all to public using (platform_private.cms_rpc_context_valid()) with check (platform_private.cms_rpc_context_valid())', table_name || '_rpc_policy', table_name);
  end loop;
end;
$body$;

drop trigger if exists cms_organization_actor_grant_activation_review_invalidation
  on identity_private.organization_actor_grant;
create trigger cms_organization_actor_grant_activation_review_invalidation
after insert or update or delete on identity_private.organization_actor_grant
for each row execute function platform_private.cms_activation_review_invalidation_trigger();
drop trigger if exists cms_membership_tenure_activation_review_invalidation
  on identity_private.membership_tenure;
create trigger cms_membership_tenure_activation_review_invalidation
after insert or update or delete on identity_private.membership_tenure
for each row execute function platform_private.cms_activation_review_invalidation_trigger();

create or replace function platform_private.cms_actor(p_request jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
begin
  return platform_private.cfg_actor(p_request);
end;
$body$;

create or replace function platform_private.cms_acting_party(p_request jsonb, p_actor_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
begin
  return platform_private.cfg_acting_party(p_request, p_actor_id);
end;
$body$;

create or replace function platform_private.cms_correlation(p_request jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
begin
  return platform_private.cfg_correlation(p_request);
end;
$body$;

create or replace function platform_private.cms_require_capability(
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
  resolved_person_id uuid;
begin
  resolved_person_id := platform_private.identity_actor_person(p_actor_id);
  if resolved_person_id is null or p_acting_party_id is null then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
    from identity_private.membership_tenure tenure
    join identity_private.organization_actor_grant actor_grant
      on actor_grant.organization_id = tenure.organization_id
     and actor_grant.person_id = tenure.person_id
    where tenure.organization_id = p_acting_party_id
      and tenure.person_id = resolved_person_id
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

create or replace function platform_private.cms_require_read(
  p_actor_id uuid,
  p_acting_party_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  resolved_person_id uuid;
begin
  resolved_person_id := platform_private.identity_actor_person(p_actor_id);
  if resolved_person_id is null or p_acting_party_id is null then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
    from identity_private.membership_tenure tenure
    join identity_private.organization_actor_grant actor_grant
      on actor_grant.organization_id = tenure.organization_id
     and actor_grant.person_id = tenure.person_id
    where tenure.organization_id = p_acting_party_id
      and tenure.person_id = resolved_person_id
      and tenure.state = 'confirmed'
      and (tenure.ends_on is null or tenure.ends_on >= current_date)
      and actor_grant.capability_code in ('cms.schema_registry.read', 'cms.schema_designer')
      and actor_grant.active
      and actor_grant.valid_from <= current_date
      and (actor_grant.valid_through is null or actor_grant.valid_through >= current_date)
  ) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
end;
$body$;

create or replace function platform_private.cms_reserve(
  p_request jsonb,
  p_actor_id uuid,
  p_operation text
)
returns platform_private.idempotency_records
language plpgsql
security definer
set search_path = ''
as $body$
declare
  reservation platform_private.idempotency_records;
  key_value text := nullif(p_request->>'idempotencyKey', '');
begin
  if key_value is null or key_value !~ '^[ -~]{8,128}$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  reservation := platform_private.identity_idempotency_reserve(
    p_actor_id, p_operation, platform_private.cms_key_hash(key_value),
    platform_private.cms_request_hash(p_request)
  );
  if reservation.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records
    set state = 'reserved', response_ref = null
    where id = reservation.id;
    select * into reservation from platform_private.idempotency_records where id = reservation.id;
  end if;
  return reservation;
end;
$body$;

create or replace function platform_private.cms_complete(
  p_reservation_id uuid,
  p_resource_id uuid,
  p_status integer,
  p_response jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
begin
  update platform_private.idempotency_records
  set state = 'completed',
      response_ref = case when p_response is null then
        jsonb_build_object('status', p_status, 'resourceRef', p_resource_id::text)
      else
        jsonb_build_object(
          'status', p_status,
          'resourceRef', p_resource_id::text,
          'safeHeaders', jsonb_build_object('response', p_response)
        )
      end
  where id = p_reservation_id;
end;
$body$;

create or replace function platform_private.cms_record_audit(
  p_action text,
  p_actor_id uuid,
  p_acting_party_id uuid,
  p_target_type text,
  p_target_id uuid,
  p_reason_code text,
  p_correlation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
begin
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    p_action, p_actor_id, coalesce(p_acting_party_id, p_actor_id), p_target_type,
    p_target_id, 'allowed'::platform_private.audit_decision, p_reason_code,
    p_correlation_id
  );
end;
$body$;

create or replace function platform_private.cms_emit_event(
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
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
begin
  return platform_private.cfg_emit_effects(
    p_action, p_actor_id, coalesce(p_acting_party_id, p_actor_id), p_target_type,
    p_target_id, p_reason_code, p_event_type, p_aggregate_type, p_aggregate_id,
    p_aggregate_version, p_payload, p_correlation_id
  );
end;
$body$;

create or replace function platform_private.cms_expected_version(p_request jsonb)
returns bigint
language plpgsql
security definer
set search_path = ''
as $body$
declare
  value text := coalesce(nullif(p_request->>'expectedVersion', ''), nullif(p_request->>'ifMatch', ''));
begin
  if value is null or value !~ '^"[1-9][0-9]*"$' and value !~ '^[1-9][0-9]*$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  value := pg_catalog.btrim(value, '"');
  return value::bigint;
exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception 'INVALID_REQUEST' using errcode = 'P0001';
end;
$body$;

create or replace function platform_private.cms_activation_risk_class(
  p_workflow_key text
)
returns text
language sql
immutable
strict
set search_path = ''
as $body$
  select case
    when p_workflow_key in ('protected', 'high-risk', 'high_risk')
      then 'protected'
    else 'ordinary'
  end
$body$;

create or replace function platform_private.cms_type_version_resource(p_version_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $body$
  select jsonb_build_object(
    'resourceKind', 'content_type_version',
    'id', version_row.id,
    'version', version_row.version::text,
    'contentHash', version_row.definition_hash,
    'createdAt', version_row.created_at,
    'updatedAt', version_row.updated_at,
    'state', version_row.state::text,
    'contentTypeId', version_row.content_type_id,
    'typeKey', type_row.type_key,
    'label', coalesce(version_row.labels->>'label', type_row.type_key),
    'ownerCapability', type_row.owner_capability,
    'sourceLocale', version_row.source_locale,
    'defaultLocale', version_row.default_locale,
    'workflowKey', version_row.workflow_key,
    'workflowVersion', version_row.workflow_version::text,
    'defaultTemplateVersionId', version_row.default_template_version_id,
    'schemaArtifactId', version_row.schema_artifact_id,
    'fieldCount', (select count(*) from platform_private.cms_field_definition_versions field where field.content_type_version_id = version_row.id),
    'relationCount', (select count(*) from platform_private.cms_relation_definitions relation where relation.field_definition_id in (select field.id from platform_private.cms_field_definition_versions field where field.content_type_version_id = version_row.id)),
    'capabilityBindingCount', (select count(*) from platform_private.cms_content_type_capability_bindings binding where binding.content_type_version_id = version_row.id),
    'compatibility', version_row.compatibility,
    'dryRunId', version_row.dry_run_id,
    'activationEvidence', case when version_row.activation_workflow_policy_key is null then null else jsonb_build_object(
      'key', version_row.activation_workflow_policy_key,
      'version', version_row.activation_workflow_policy_version::text,
      'policyHash', version_row.activation_workflow_policy_hash,
      'riskClass', platform_private.cms_activation_risk_class(version_row.workflow_key),
      'requiredDecisionCount', version_row.activation_required_decision_count,
      'requiredCapabilities', version_row.activation_required_capabilities,
      'approvalEvidenceHash', version_row.activation_approval_evidence_hash
    ) end
  )
  from platform_private.cms_content_type_versions version_row
  join platform_private.cms_content_types type_row on type_row.id = version_row.content_type_id
  where version_row.id = p_version_id
$body$;

create or replace function platform_private.cms_migration_transform_hash(
  p_classification text,
  p_transform_key text,
  p_transform_version bigint,
  p_source_hash text,
  p_target_hash text,
  p_compiler_hash text,
  p_compiler_version text
)
returns text
language sql
stable
set search_path = ''
as $body$
  select platform_private.cms_jcs_sha256(jsonb_build_object(
    'classification', p_classification,
    'transformKey', p_transform_key,
    'transformVersion', p_transform_version,
    'sourceHash', p_source_hash,
    'targetHash', p_target_hash,
    'compilerHash', p_compiler_hash,
    'compilerVersion', p_compiler_version
  ))
$body$;

-- Validate the normative dry-run object independently of the mutable worker
-- counters.  A UUID on a candidate or plan is only an identifier; it becomes
-- usable evidence only when this immutable report binds the exact source,
-- target, compiler, transform, result, counters, and live lease.
create or replace function platform_private.cms_dry_run_report_valid(
  p_report jsonb,
  p_dry_run_id uuid,
  p_classification text,
  p_transform_key text,
  p_transform_version bigint,
  p_source_hash text,
  p_target_hash text,
  p_compiler_hash text,
  p_compiler_version text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  report_source_hash text;
  report_target_hash text;
  report_transform_hash text;
  report_transform_version text;
  report_compiler_hash text;
  report_compiler_version text;
  report_lease_expires_at timestamptz;
begin
  if p_report is null
     or pg_catalog.jsonb_typeof(p_report) <> 'object'
     or p_dry_run_id is null
     or p_classification not in ('additive', 'conditional', 'breaking')
     or p_source_hash is null
     or p_target_hash is null
     or p_compiler_hash is null
     or p_source_hash !~ '^[a-f0-9]{64}$'
     or p_target_hash !~ '^[a-f0-9]{64}$'
     or p_compiler_hash !~ '^[a-f0-9]{64}$'
     or p_compiler_version is null
     or p_report->>'dryRunId' <> p_dry_run_id::text
     or p_report->>'result' <> 'pass'
     or pg_catalog.jsonb_typeof(p_report->'lease') <> 'object'
     or p_report->'lease'->>'state' not in ('leased', 'running', 'ready', 'completed')
     or (p_report ? 'sourceHash' and p_report ? 'sourceDefinitionHash'
       and p_report->>'sourceHash' is distinct from p_report->>'sourceDefinitionHash')
     or (p_report ? 'targetHash' and p_report ? 'targetDefinitionHash'
       and p_report->>'targetHash' is distinct from p_report->>'targetDefinitionHash') then
    return false;
  end if;
  report_source_hash := coalesce(
    p_report->>'sourceHash', p_report->>'sourceDefinitionHash'
  );
  report_target_hash := coalesce(
    p_report->>'targetHash', p_report->>'targetDefinitionHash'
  );
  report_transform_hash := p_report->>'transformHash';
  report_transform_version := p_report->>'transformVersion';
  report_compiler_hash := p_report->>'compilerHash';
  report_compiler_version := p_report->>'compilerVersion';
  if report_source_hash is distinct from p_source_hash
     or report_target_hash is distinct from p_target_hash
     or report_compiler_hash is distinct from p_compiler_hash
     or report_compiler_version is distinct from p_compiler_version
     or report_transform_hash !~ '^[a-f0-9]{64}$'
     or report_transform_hash is distinct from platform_private.cms_migration_transform_hash(
       p_classification, p_transform_key, p_transform_version,
       p_source_hash, p_target_hash, p_compiler_hash, p_compiler_version
     ) then
    return false;
  end if;
  if p_classification = 'additive' then
    if p_transform_key is not null
       or p_transform_version is not null
       or p_report ? 'transformKey'
       or p_report ? 'transformVersion' then
      return false;
    end if;
  elsif p_transform_key is null
     or p_transform_version is null
     or report_transform_version !~ '^[1-9][0-9]{0,17}$'
     or report_transform_version::bigint <> p_transform_version
     or p_report->>'transformKey' <> p_transform_key then
    return false;
  end if;
  if p_report->>'sourceCount' !~ '^[0-9][0-9]{0,17}$'
     or p_report->>'targetCount' !~ '^[0-9][0-9]{0,17}$'
     or p_report->>'rowErrorCount' !~ '^[0-9][0-9]{0,17}$'
     or p_report->>'migratedCount' !~ '^[0-9][0-9]{0,17}$'
     or p_report->>'failedCount' !~ '^[0-9][0-9]{0,17}$' then
    return false;
  end if;
  begin
    report_lease_expires_at := (p_report->'lease'->>'expiresAt')::timestamptz;
  exception when others then
    return false;
  end;
  return report_lease_expires_at is not null
     and report_lease_expires_at >= pg_catalog.statement_timestamp();
exception when others then
  return false;
end;
$body$;

-- Record a producer report exactly once.  A caller may supply a report only at
-- this boundary; it is checked against every current fingerprint before it is
-- copied into the immutable authority.  Replays may present the same report,
-- but a different value for an existing UUID is rejected by the verification
-- immediately after the conflict-safe insert.
create or replace function platform_private.cms_record_dry_run_report(
  p_report_id uuid,
  p_owner_id uuid,
  p_content_type_id uuid,
  p_source_version_id uuid,
  p_target_version_id uuid,
  p_classification text,
  p_transform_key text,
  p_transform_version bigint,
  p_source_hash text,
  p_target_hash text,
  p_compiler_hash text,
  p_compiler_version text,
  p_report jsonb,
  p_created_by uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  existing_report jsonb;
begin
  if not platform_private.cms_dry_run_report_valid(
    p_report, p_report_id, p_classification, p_transform_key,
    p_transform_version, p_source_hash, p_target_hash, p_compiler_hash,
    p_compiler_version
  ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  insert into platform_private.cms_schema_dry_run_reports(
    id, owner_id, content_type_id, source_version_id, target_version_id,
    classification, transform_key, transform_version, source_hash, target_hash,
    compiler_hash, compiler_version, source_count, target_count,
    row_error_count, migrated_count, failed_count, result, report, created_by
  ) values (
    p_report_id, p_owner_id, p_content_type_id, p_source_version_id,
    p_target_version_id, p_classification, p_transform_key, p_transform_version,
    p_source_hash, p_target_hash, p_compiler_hash, p_compiler_version,
    (p_report->>'sourceCount')::bigint, (p_report->>'targetCount')::bigint,
    (p_report->>'rowErrorCount')::bigint, (p_report->>'migratedCount')::bigint,
    (p_report->>'failedCount')::bigint, 'pass', p_report, p_created_by
  )
  on conflict (id) do nothing;
  select report.report
    into existing_report
    from platform_private.cms_schema_dry_run_reports report
   where report.id = p_report_id;
  if not found or existing_report is distinct from p_report then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if not platform_private.cms_persisted_dry_run_report_valid(
    p_report_id, p_owner_id, p_content_type_id, p_source_version_id,
    p_target_version_id, p_classification, p_transform_key, p_transform_version,
    p_source_hash, p_target_hash, p_compiler_hash, p_compiler_version
  ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
end;
$body$;

-- Validate the immutable producer snapshot without treating its historical
-- lease expiry as a live worker lease.  The mutable plan must still carry a
-- current lease when it is running/ready; this helper proves that the
-- source/target/compiler/transform and report counters came from the same
-- persisted dry-run record and were not fabricated by activation.
create or replace function platform_private.cms_persisted_dry_run_report_valid(
  p_report_id uuid,
  p_owner_id uuid,
  p_content_type_id uuid,
  p_source_version_id uuid,
  p_target_version_id uuid,
  p_classification text,
  p_transform_key text,
  p_transform_version bigint,
  p_source_hash text,
  p_target_hash text,
  p_compiler_hash text,
  p_compiler_version text
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  report_row platform_private.cms_schema_dry_run_reports%rowtype;
  lease_expires_at timestamptz;
begin
  if p_report_id is null
     or p_owner_id is null
     or p_content_type_id is null
     or p_target_version_id is null
     or p_classification not in ('additive', 'conditional', 'breaking') then
    return false;
  end if;
  select * into report_row
    from platform_private.cms_schema_dry_run_reports report
   where report.id = p_report_id
     and report.owner_id = p_owner_id
     and report.content_type_id = p_content_type_id
     and report.source_version_id is not distinct from p_source_version_id
     and report.target_version_id = p_target_version_id
     and report.classification = p_classification
     and report.transform_key is not distinct from p_transform_key
     and report.transform_version is not distinct from p_transform_version
     and report.source_hash = p_source_hash
     and report.target_hash = p_target_hash
     and report.compiler_hash = p_compiler_hash
     and report.compiler_version = p_compiler_version;
  if not found
     or report_row.result <> 'pass'
     or report_row.report->>'dryRunId' is distinct from p_report_id::text
     or report_row.report->>'result' <> 'pass'
     or coalesce(
       report_row.report->>'sourceHash',
       report_row.report->>'sourceDefinitionHash'
     ) is distinct from p_source_hash
     or coalesce(
       report_row.report->>'targetHash',
       report_row.report->>'targetDefinitionHash'
     ) is distinct from p_target_hash
     or report_row.report->>'compilerHash' is distinct from p_compiler_hash
     or report_row.report->>'compilerVersion' is distinct from p_compiler_version
     or report_row.report->>'transformHash' is distinct from platform_private.cms_migration_transform_hash(
       p_classification, p_transform_key, p_transform_version,
       p_source_hash, p_target_hash, p_compiler_hash, p_compiler_version
     )
     or report_row.report->>'sourceCount' is distinct from report_row.source_count::text
     or report_row.report->>'targetCount' is distinct from report_row.target_count::text
     or report_row.report->>'rowErrorCount' is distinct from report_row.row_error_count::text
     or report_row.report->>'migratedCount' is distinct from report_row.migrated_count::text
     or report_row.report->>'failedCount' is distinct from report_row.failed_count::text
     or pg_catalog.jsonb_typeof(report_row.report->'lease') <> 'object'
     or report_row.report->'lease'->>'state' not in ('leased', 'running', 'ready', 'completed') then
    return false;
  end if;
  if p_classification = 'additive' then
    if p_transform_key is not null
       or p_transform_version is not null
       or report_row.report ? 'transformKey'
       or report_row.report ? 'transformVersion' then
      return false;
    end if;
  elsif p_transform_key is null
     or p_transform_version is null
     or report_row.report->>'transformKey' is distinct from p_transform_key
     or report_row.report->>'transformVersion' is distinct from p_transform_version::text then
    return false;
  end if;
  begin
    lease_expires_at := (report_row.report->'lease'->>'expiresAt')::timestamptz;
  exception when others then
    return false;
  end;
  return lease_expires_at is not null;
exception when others then
  return false;
end;
$body$;

-- S09 owns the schema registry and migration metadata, but not the content
-- rows or a registered row-transform executor.  Counter arithmetic therefore
-- cannot prove that a nonempty migration transformed anything.  Keep this
-- boundary fail-closed until the slice that owns source rows supplies durable
-- per-row transformation evidence and replaces this zero-row policy.
create or replace function platform_private.cms_migration_source_evidence_valid(
  p_plan platform_private.cms_schema_migration_plans
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $body$
  select p_plan.source_count = 0
     and p_plan.target_count = 0
     and p_plan.row_error_count = 0
     and p_plan.migrated_count = 0
     and p_plan.failed_count = 0
     and p_plan.cursor = 0
$body$;

create or replace function platform_private.cms_migration_plan_ready(
  p_plan_id uuid,
  p_content_type_id uuid,
  p_to_version_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  plan_row platform_private.cms_schema_migration_plans%rowtype;
  source_hash text;
  target_hash text;
  compiler_hash text;
  transform_hash text;
  transform_version_text text;
  compiler_version text;
  lease_state text;
  lease_expires_at timestamptz;
  report_source_count bigint;
  report_target_count bigint;
  report_row_error_count bigint;
  report_migrated_count bigint;
  report_failed_count bigint;
  target_dry_run_id text;
  recomputed_transform_hash text;
begin
  select * into plan_row
  from platform_private.cms_schema_migration_plans plan
  where plan.id = p_plan_id
    and plan.content_type_id = p_content_type_id
    and plan.to_version_id = p_to_version_id
    and plan.state in ('ready', 'completed')
    and plan.failed_count = 0
    and plan.row_error_count = 0;
  if not found then return false; end if;
  if not platform_private.cms_migration_source_evidence_valid(plan_row) then
    return false;
  end if;
  source_hash := coalesce(
    plan_row.dry_run_report->>'sourceHash',
    plan_row.dry_run_report->>'sourceDefinitionHash'
  );
  target_hash := coalesce(
    plan_row.dry_run_report->>'targetHash',
    plan_row.dry_run_report->>'targetDefinitionHash'
  );
  transform_hash := plan_row.dry_run_report->>'transformHash';
  transform_version_text := plan_row.dry_run_report->>'transformVersion';
  compiler_hash := plan_row.dry_run_report->>'compilerHash';
  compiler_version := plan_row.dry_run_report->>'compilerVersion';
  select version_row.dry_run_id::text
    into target_dry_run_id
    from platform_private.cms_content_type_versions version_row
   where version_row.id = plan_row.to_version_id
     and version_row.content_type_id = plan_row.content_type_id
     and version_row.owner_id = plan_row.owner_id;
  recomputed_transform_hash := platform_private.cms_migration_transform_hash(
    plan_row.classification,
    plan_row.transform_key,
    plan_row.transform_version,
    source_hash,
    target_hash,
    compiler_hash,
    compiler_version
  );
  lease_state := plan_row.dry_run_report->'lease'->>'state';
  begin
    lease_expires_at := (plan_row.dry_run_report->'lease'->>'expiresAt')::timestamptz;
    if plan_row.dry_run_report->>'sourceCount' !~ '^[0-9]+$'
       or plan_row.dry_run_report->>'targetCount' !~ '^[0-9]+$'
       or plan_row.dry_run_report->>'rowErrorCount' !~ '^[0-9]+$'
       or plan_row.dry_run_report->>'migratedCount' !~ '^[0-9]+$'
       or plan_row.dry_run_report->>'failedCount' !~ '^[0-9]+$' then
      return false;
    end if;
    report_source_count := (plan_row.dry_run_report->>'sourceCount')::bigint;
    report_target_count := (plan_row.dry_run_report->>'targetCount')::bigint;
    report_row_error_count := (plan_row.dry_run_report->>'rowErrorCount')::bigint;
    report_migrated_count := (plan_row.dry_run_report->>'migratedCount')::bigint;
    report_failed_count := (plan_row.dry_run_report->>'failedCount')::bigint;
  exception when others then
    return false;
  end;
  return source_hash = (
      select version_row.definition_hash
      from platform_private.cms_content_type_versions version_row
      where version_row.id = plan_row.from_version_id
        and version_row.content_type_id = plan_row.content_type_id
        and version_row.owner_id = plan_row.owner_id
    )
    and plan_row.classification = (
      select version_row.compatibility
      from platform_private.cms_content_type_versions version_row
      where version_row.id = plan_row.to_version_id
        and version_row.content_type_id = plan_row.content_type_id
        and version_row.owner_id = plan_row.owner_id
    )
    and target_hash = (
      select version_row.definition_hash
      from platform_private.cms_content_type_versions version_row
      where version_row.id = plan_row.to_version_id
        and version_row.content_type_id = plan_row.content_type_id
        and version_row.owner_id = plan_row.owner_id
    )
    and transform_hash ~ '^[a-f0-9]{64}$'
    and transform_hash = recomputed_transform_hash
    and (
      (plan_row.transform_key is null
       and plan_row.transform_version is null
       and plan_row.classification = 'additive')
      or (
        plan_row.transform_key is not null
        and plan_row.transform_version is not null
        and plan_row.classification in ('conditional', 'breaking')
        and plan_row.dry_run_report->>'transformKey' = plan_row.transform_key
        and transform_version_text ~ '^[1-9][0-9]{0,17}$'
        and transform_version_text::bigint = plan_row.transform_version
      )
    )
    and compiler_hash = (
      select artifact.artifact_hash
      from platform_private.cms_schema_artifacts artifact
      where artifact.content_type_version_id = plan_row.to_version_id
        and artifact.owner_id = plan_row.owner_id
        and artifact.state = 'compiled'
    )
    and compiler_hash ~ '^[a-f0-9]{64}$'
    and compiler_version = (
      select artifact.compiler_version
      from platform_private.cms_schema_artifacts artifact
      where artifact.content_type_version_id = plan_row.to_version_id
        and artifact.state = 'compiled'
    )
    and report_source_count = plan_row.source_count
    and report_target_count = plan_row.target_count
    and report_row_error_count = plan_row.row_error_count
    and report_migrated_count = plan_row.migrated_count
    and report_failed_count = plan_row.failed_count
    and plan_row.cursor >= plan_row.source_count
    and platform_private.cms_valid_uuid(target_dry_run_id)
    and plan_row.dry_run_report->>'dryRunId' = target_dry_run_id
    and platform_private.cms_dry_run_report_valid(
      plan_row.dry_run_report,
      case when platform_private.cms_valid_uuid(target_dry_run_id)
        then target_dry_run_id::uuid else null end,
      plan_row.classification,
      plan_row.transform_key,
      plan_row.transform_version,
      source_hash,
      target_hash,
      compiler_hash,
      compiler_version
    )
    and platform_private.cms_persisted_dry_run_report_valid(
      case when platform_private.cms_valid_uuid(target_dry_run_id)
        then target_dry_run_id::uuid else null end,
      plan_row.owner_id,
      plan_row.content_type_id,
      plan_row.from_version_id,
      plan_row.to_version_id,
      plan_row.classification,
      plan_row.transform_key,
      plan_row.transform_version,
      source_hash,
      target_hash,
      compiler_hash,
      compiler_version
    )
    and (
      select report.source_count
      from platform_private.cms_schema_dry_run_reports report
      where report.id = case when platform_private.cms_valid_uuid(target_dry_run_id)
        then target_dry_run_id::uuid else null end
    ) = plan_row.source_count
    and (
      select report.target_count
      from platform_private.cms_schema_dry_run_reports report
      where report.id = case when platform_private.cms_valid_uuid(target_dry_run_id)
        then target_dry_run_id::uuid else null end
    ) = plan_row.target_count
    and (
      select report.row_error_count
      from platform_private.cms_schema_dry_run_reports report
      where report.id = case when platform_private.cms_valid_uuid(target_dry_run_id)
        then target_dry_run_id::uuid else null end
    ) = plan_row.row_error_count
    and (
      select report.failed_count
      from platform_private.cms_schema_dry_run_reports report
      where report.id = case when platform_private.cms_valid_uuid(target_dry_run_id)
        then target_dry_run_id::uuid else null end
    ) = plan_row.failed_count
    and plan_row.dry_run_report->>'result' = 'pass'
    and lease_state in ('leased', 'running', 'ready', 'completed')
    and lease_expires_at is not null
    and lease_expires_at >= pg_catalog.statement_timestamp();
end;
$body$;

-- Activation is a second, server-owned validation boundary.  The draft RPC
-- validates request JSON, but later child rows and cross-shard registries can
-- change before approval.  Rebuild the persisted rows into the same strict
-- input grammar and resolve every named reference again while the candidate
-- lock is held.
create or replace function platform_private.cms_activation_references_valid(
  p_version_id uuid
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  version_row platform_private.cms_content_type_versions%rowtype;
  type_row platform_private.cms_content_types%rowtype;
  artifact_row platform_private.cms_schema_artifacts%rowtype;
  field_row record;
  relation_row record;
  template_row record;
  capability_row record;
  manifest_entry jsonb;
  schema_value jsonb;
  field_value jsonb;
  relation_value jsonb;
begin
  if p_version_id is null then
    return false;
  end if;
  select version_row_candidate.* into version_row
  from platform_private.cms_content_type_versions version_row_candidate
  where version_row_candidate.id = p_version_id;
  if not found then
    return false;
  end if;
  select type_row_candidate.* into type_row
  from platform_private.cms_content_types type_row_candidate
  where type_row_candidate.id = version_row.content_type_id;
  if not found
     or type_row.owner_id is distinct from version_row.owner_id
     or not platform_private.cms_capability_registry_valid(
       type_row.owner_capability, null
     ) then
    return false;
  end if;
  if not platform_private.cms_workflow_registry_valid(
    version_row.workflow_key, version_row.workflow_version
  ) then
    return false;
  end if;
  if version_row.default_template_version_id is not null
     and not platform_private.cms_template_registry_valid(
       version_row.default_template_version_id
     ) then
    return false;
  end if;
  select artifact.* into artifact_row
  from platform_private.cms_schema_artifacts artifact
  where artifact.id = version_row.schema_artifact_id
    and artifact.content_type_version_id = version_row.id
    and artifact.owner_id = version_row.owner_id
    and artifact.state = 'compiled';
  if not found
     or artifact_row.artifact_hash is distinct from version_row.definition_hash
     or not platform_private.cms_compiler_registry_valid(
       artifact_row.compiler_version
     )
     or artifact_row.zod_contract_ref !~ (
       '^cms/content-type/' || type_row.type_key || '/v[1-9][0-9]*$'
     )
     or not platform_private.cms_valid_hash(artifact_row.artifact_hash) then
    return false;
  end if;

  schema_value := artifact_row.editor_manifest->'schema';
  if not platform_private.cms_exact_keys(
    artifact_row.editor_manifest,
    array['schema','fields']::text[],
    array['schema','fields']::text[]
  ) or not platform_private.cms_exact_keys(
    schema_value,
    array[
      'typeKey','label','ownerCapability','sourceLocale','defaultLocale',
      'workflowKey','workflowVersion','defaultTemplateVersionId','fields',
      'relations','templateBindings','capabilityBindings'
    ]::text[],
    array[
      'typeKey','label','ownerCapability','sourceLocale','defaultLocale',
      'workflowKey','workflowVersion','defaultTemplateVersionId','fields',
      'relations','templateBindings','capabilityBindings'
    ]::text[]
  ) then
    return false;
  end if;
  if schema_value->>'typeKey' is distinct from type_row.type_key
     or schema_value->>'ownerCapability' is distinct from type_row.owner_capability
     or schema_value->>'label' is distinct from version_row.labels->>'label'
     or schema_value->>'workflowKey' is distinct from version_row.workflow_key
     or schema_value->>'workflowVersion' is distinct from version_row.workflow_version::text
     or schema_value->>'sourceLocale' is distinct from version_row.source_locale
     or schema_value->>'defaultLocale' is distinct from version_row.default_locale
     or pg_catalog.jsonb_typeof(schema_value->'fields') <> 'array'
     or pg_catalog.jsonb_typeof(schema_value->'relations') <> 'array'
     or pg_catalog.jsonb_typeof(schema_value->'templateBindings') <> 'array'
     or pg_catalog.jsonb_typeof(schema_value->'capabilityBindings') <> 'array'
     or not platform_private.cms_capability_registry_valid(
       schema_value->>'ownerCapability', null
     )
     or not platform_private.cms_workflow_registry_valid(
       schema_value->>'workflowKey',
       case when platform_private.cms_valid_version(schema_value->>'workflowVersion')
         then (schema_value->>'workflowVersion')::bigint else null end
    ) then
    return false;
  end if;
  -- The artifact is a complete-set snapshot, not a lower-bound allowlist.
  -- Count and distinct-identity checks reject both extra persisted children and
  -- duplicate manifest entries that could otherwise hide a missing row.
  if (select count(*) from platform_private.cms_field_definition_versions field
      where field.content_type_version_id = version_row.id)
       <> pg_catalog.jsonb_array_length(schema_value->'fields')
     or (select count(distinct field_entry.value->>'stableFieldId')
         from pg_catalog.jsonb_array_elements(schema_value->'fields') field_entry(value))
       <> pg_catalog.jsonb_array_length(schema_value->'fields')
     or (select count(*)
         from platform_private.cms_relation_definitions relation
         join platform_private.cms_field_definition_versions field
           on field.id = relation.field_definition_id
         where field.content_type_version_id = version_row.id)
       <> pg_catalog.jsonb_array_length(schema_value->'relations')
     or (select count(distinct relation_entry.value->>'fieldId')
         from pg_catalog.jsonb_array_elements(schema_value->'relations') relation_entry(value))
       <> pg_catalog.jsonb_array_length(schema_value->'relations')
     or (select count(*)
         from platform_private.cms_content_type_template_bindings binding
         where binding.content_type_version_id = version_row.id)
       <> pg_catalog.jsonb_array_length(schema_value->'templateBindings')
     or (select count(distinct template_entry.value->>'templateVersionId')
         from pg_catalog.jsonb_array_elements(schema_value->'templateBindings') template_entry(value))
       <> pg_catalog.jsonb_array_length(schema_value->'templateBindings')
     or (select count(*)
         from platform_private.cms_content_type_capability_bindings binding
         where binding.content_type_version_id = version_row.id)
       <> pg_catalog.jsonb_array_length(schema_value->'capabilityBindings')
     or (select count(distinct (capability_entry.value->>'capabilityKey')
                                   || ':' || (capability_entry.value->>'capabilityVersion'))
         from pg_catalog.jsonb_array_elements(schema_value->'capabilityBindings') capability_entry(value))
       <> pg_catalog.jsonb_array_length(schema_value->'capabilityBindings') then
    return false;
  end if;
  if artifact_row.editor_manifest->'fields' is distinct from schema_value->'fields'
     or artifact_row.renderer_manifest->'relations' is distinct from schema_value->'relations'
     or artifact_row.renderer_manifest->'templateBindings' is distinct from schema_value->'templateBindings'
     or artifact_row.renderer_manifest->'capabilityBindings' is distinct from schema_value->'capabilityBindings' then
    return false;
  end if;
  if schema_value->'defaultTemplateVersionId' <> 'null'::jsonb
     and (
       not platform_private.cms_valid_uuid(
         schema_value->>'defaultTemplateVersionId'
       )
       or not platform_private.cms_template_registry_valid(
         (schema_value->>'defaultTemplateVersionId')::uuid
       )
     ) then
    return false;
  end if;
  if schema_value->'defaultTemplateVersionId' is distinct from coalesce(
       pg_catalog.to_jsonb(version_row.default_template_version_id),
       'null'::jsonb
     ) then
    return false;
  end if;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(schema_value->'fields') as value
  loop
    if not platform_private.cms_valid_field_input(manifest_entry, true)
       then
      return false;
    end if;
    select field.* into field_row
      from platform_private.cms_field_definition_versions field
     where field.content_type_version_id = version_row.id
       and field.stable_field_id = (manifest_entry->>'stableFieldId')::uuid;
    if not found then
      return false;
    end if;
    field_value := jsonb_build_object(
      'stableFieldId', field_row.stable_field_id,
      'key', field_row.field_key,
      'kind', field_row.kind,
      'constraints', field_row.constraints,
      'required', field_row.required,
      'validatorKey', field_row.validator_key,
      'validatorVersion', field_row.validator_version::text,
      'defaultMode', field_row.default_mode,
      'localizationMode', field_row.localization_mode,
      'editorConfig', field_row.editor_config,
      'lifecycle', field_row.state
    );
    if field_row.default_value is not null then
      field_value := field_value
        || jsonb_build_object('defaultValue', field_row.default_value);
    end if;
    if field_value is distinct from manifest_entry then
      return false;
    end if;
  end loop;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(schema_value->'relations') as value
  loop
    if not platform_private.cms_valid_relation_input(manifest_entry)
       then
      return false;
    end if;
    select relation.*, field.kind as field_kind, field.owner_id as field_owner_id
      into relation_row
      from platform_private.cms_relation_definitions relation
      join platform_private.cms_field_definition_versions field
        on field.id = relation.field_definition_id
     where field.content_type_version_id = version_row.id
       and field.id = (manifest_entry->>'fieldId')::uuid
       and field.kind = 'relation';
    if not found then
      return false;
    end if;
    relation_value := jsonb_build_object(
      'fieldId', relation_row.field_definition_id,
      'targetKind', relation_row.target_kind,
      'targetType', relation_row.target_type,
      'projectionKey', relation_row.projection_key,
      'cardinality', relation_row.cardinality,
      'min', relation_row.min_count,
      'max', relation_row.max_count,
      'ordered', relation_row.ordered,
      'onUnavailable', relation_row.on_unavailable
    );
    if relation_value is distinct from manifest_entry then
      return false;
    end if;
  end loop;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(schema_value->'templateBindings') as value
  loop
    if not platform_private.cms_exact_keys(
      manifest_entry,
      array['templateVersionId']::text[],
      array['templateVersionId']::text[]
    ) or not platform_private.cms_valid_uuid(manifest_entry->>'templateVersionId')
      or not platform_private.cms_template_registry_valid(
        (manifest_entry->>'templateVersionId')::uuid
      ) or not exists (
        select 1
        from platform_private.cms_content_type_template_bindings binding
        where binding.content_type_version_id = version_row.id
          and binding.template_version_id = (manifest_entry->>'templateVersionId')::uuid
      ) then
      return false;
    end if;
  end loop;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(schema_value->'capabilityBindings') as value
  loop
    if not platform_private.cms_exact_keys(
      manifest_entry,
      array['capabilityKey','capabilityVersion']::text[],
      array['capabilityKey','capabilityVersion']::text[]
    ) or not platform_private.cms_valid_version(manifest_entry->>'capabilityVersion')
      or not platform_private.cms_capability_registry_valid(
        manifest_entry->>'capabilityKey',
        (manifest_entry->>'capabilityVersion')::bigint
      ) or not exists (
        select 1
        from platform_private.cms_content_type_capability_bindings binding
        where binding.content_type_version_id = version_row.id
          and binding.capability_key = manifest_entry->>'capabilityKey'
          and binding.capability_version = (manifest_entry->>'capabilityVersion')::bigint
      ) then
      return false;
    end if;
  end loop;

  for field_row in
    select *
    from platform_private.cms_field_definition_versions field
    where field.content_type_version_id = version_row.id
    order by field.id
  loop
    if field_row.owner_id is distinct from version_row.owner_id then
      return false;
    end if;
    field_value := jsonb_build_object(
      'stableFieldId', field_row.stable_field_id,
      'key', field_row.field_key,
      'kind', field_row.kind,
      'constraints', field_row.constraints,
      'required', field_row.required,
      'validatorKey', field_row.validator_key,
      'validatorVersion', field_row.validator_version::text,
      'defaultMode', field_row.default_mode,
      'localizationMode', field_row.localization_mode,
      'editorConfig', field_row.editor_config,
      'lifecycle', field_row.state
    );
    if field_row.default_value is not null then
      field_value := field_value
        || jsonb_build_object('defaultValue', field_row.default_value);
    end if;
    if not platform_private.cms_valid_field_input(field_value, true) then
      return false;
    end if;
    if field_row.kind = 'relation' then
      if (select count(*) from platform_private.cms_relation_definitions relation
          where relation.field_definition_id = field_row.id) <> 1 then
        return false;
      end if;
    elsif exists (
      select 1 from platform_private.cms_relation_definitions relation
      where relation.field_definition_id = field_row.id
    ) then
      return false;
    end if;
  end loop;
  for relation_row in
    select relation.*, field.kind as field_kind, field.owner_id as field_owner_id
    from platform_private.cms_relation_definitions relation
    join platform_private.cms_field_definition_versions field
      on field.id = relation.field_definition_id
    where field.content_type_version_id = version_row.id
    order by relation.id
  loop
    relation_value := jsonb_build_object(
      'fieldId', relation_row.field_definition_id,
      'targetKind', relation_row.target_kind,
      'targetType', relation_row.target_type,
      'projectionKey', relation_row.projection_key,
      'cardinality', relation_row.cardinality,
      'min', relation_row.min_count,
      'max', relation_row.max_count,
      'ordered', relation_row.ordered,
      'onUnavailable', relation_row.on_unavailable
    );
    if relation_row.owner_id is distinct from version_row.owner_id
       or relation_row.field_owner_id is distinct from version_row.owner_id
       or relation_row.field_kind <> 'relation'
       or not platform_private.cms_valid_relation_input(relation_value) then
      return false;
    end if;
  end loop;
  for template_row in
    select *
    from platform_private.cms_content_type_template_bindings binding
    where binding.content_type_version_id = version_row.id
    order by binding.position, binding.id
  loop
    if template_row.owner_id is distinct from version_row.owner_id
       or not platform_private.cms_template_registry_valid(
         template_row.template_version_id
       ) then
      return false;
    end if;
  end loop;
  for capability_row in
    select *
    from platform_private.cms_content_type_capability_bindings binding
    where binding.content_type_version_id = version_row.id
    order by binding.capability_key, binding.capability_version
  loop
    if capability_row.owner_id is distinct from version_row.owner_id
       or not platform_private.cms_capability_registry_valid(
         capability_row.capability_key, capability_row.capability_version
       ) then
      return false;
    end if;
  end loop;

  if not platform_private.cms_exact_keys(
    artifact_row.renderer_manifest,
    array['relations','templateBindings','capabilityBindings']::text[],
    array[
      'relations','templateBindings','capabilityBindings','blocks',
      'blockDefinitions','rendererRefs','schemaRefs','dataSourcePermissions'
    ]::text[]
  ) or pg_catalog.jsonb_typeof(artifact_row.renderer_manifest->'relations') <> 'array'
    or pg_catalog.jsonb_typeof(artifact_row.renderer_manifest->'templateBindings') <> 'array'
    or pg_catalog.jsonb_typeof(artifact_row.renderer_manifest->'capabilityBindings') <> 'array' then
    return false;
  end if;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(
      artifact_row.renderer_manifest->'relations'
    ) as value
  loop
    if not platform_private.cms_valid_relation_input(manifest_entry)
       or not exists (
         select 1
         from platform_private.cms_field_definition_versions field
         where field.content_type_version_id = version_row.id
           and field.id = (manifest_entry->>'fieldId')::uuid
           and field.kind = 'relation'
       ) then
      return false;
    end if;
  end loop;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(
      artifact_row.renderer_manifest->'templateBindings'
    ) as value
  loop
    if not platform_private.cms_exact_keys(
      manifest_entry,
      array['templateVersionId']::text[],
      array['templateVersionId']::text[]
    ) or not platform_private.cms_valid_uuid(manifest_entry->>'templateVersionId')
      or not platform_private.cms_template_registry_valid(
        (manifest_entry->>'templateVersionId')::uuid
      ) then
      return false;
    end if;
  end loop;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(
      artifact_row.renderer_manifest->'capabilityBindings'
    ) as value
  loop
    if not platform_private.cms_exact_keys(
      manifest_entry,
      array['capabilityKey','capabilityVersion']::text[],
      array['capabilityKey','capabilityVersion']::text[]
    ) or not platform_private.cms_valid_version(manifest_entry->>'capabilityVersion')
      or not platform_private.cms_capability_registry_valid(
        manifest_entry->>'capabilityKey',
        (manifest_entry->>'capabilityVersion')::bigint
      ) then
      return false;
    end if;
  end loop;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(
      coalesce(artifact_row.renderer_manifest->'rendererRefs', '[]'::jsonb)
    ) as value
  loop
    if pg_catalog.jsonb_typeof(manifest_entry) <> 'string'
       or not platform_private.cms_renderer_registry_valid(manifest_entry #>> '{}') then
      return false;
    end if;
  end loop;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(
      coalesce(artifact_row.renderer_manifest->'schemaRefs', '[]'::jsonb)
    ) as value
  loop
    if pg_catalog.jsonb_typeof(manifest_entry) <> 'string'
       or not platform_private.cms_schema_ref_registry_valid(manifest_entry #>> '{}') then
      return false;
    end if;
  end loop;
  for manifest_entry in
    select value from pg_catalog.jsonb_array_elements(
      coalesce(artifact_row.renderer_manifest->'dataSourcePermissions', '[]'::jsonb)
    ) as value
  loop
    if pg_catalog.jsonb_typeof(manifest_entry) <> 'string'
       or not platform_private.cms_data_source_registry_valid(manifest_entry #>> '{}') then
      return false;
    end if;
  end loop;
  if (
       artifact_row.renderer_manifest ? 'blocks'
       and pg_catalog.jsonb_typeof(artifact_row.renderer_manifest->'blocks') <> 'array'
     ) or (
       artifact_row.renderer_manifest ? 'blockDefinitions'
       and pg_catalog.jsonb_typeof(artifact_row.renderer_manifest->'blockDefinitions') <> 'array'
     ) then
    return false;
  end if;
  for manifest_entry in
    select value
    from pg_catalog.jsonb_array_elements(
      coalesce(artifact_row.renderer_manifest->'blocks', '[]'::jsonb)
    ) as value
    union all
    select value
    from pg_catalog.jsonb_array_elements(
      coalesce(artifact_row.renderer_manifest->'blockDefinitions', '[]'::jsonb)
    ) as value
  loop
    if not platform_private.cms_block_reference_valid(manifest_entry) then
      return false;
    end if;
  end loop;
  return true;
exception when others then
  return false;
end;
$body$;

-- Both human and worker activation use this lock order.  It is deliberately
-- kept in one helper so a graph edit, block release, or binding move cannot
-- observe a partially changing dependency set:
-- candidate/parent → fields → relations → template/capability bindings →
-- exact block versions.  Review/approval/context/authority rows are locked by
-- cms_lock_activation_authority immediately afterwards.  Every multi-row
-- lock has an explicit primary-key order.
create or replace function platform_private.cms_lock_activation_graph(
  p_version_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $body$
begin
  perform 1
    from platform_private.cms_content_type_versions version_row
   where version_row.id = p_version_id
   order by version_row.id
   for update;
  perform 1
    from platform_private.cms_content_types type_row
   where type_row.id = (
     select version_row.content_type_id
     from platform_private.cms_content_type_versions version_row
     where version_row.id = p_version_id
   )
   order by type_row.id
   for update;
  perform 1
   from platform_private.cms_field_definition_versions field
   where field.content_type_version_id = p_version_id
   order by field.id
   for update;
  perform 1
    from platform_private.cms_relation_definitions relation
    join platform_private.cms_field_definition_versions field
      on field.id = relation.field_definition_id
   where field.content_type_version_id = p_version_id
   order by relation.id
   for update of relation;
  perform 1
   from platform_private.cms_content_type_template_bindings binding
   where binding.content_type_version_id = p_version_id
   order by binding.id
   for update;
  perform 1
   from platform_private.cms_content_type_capability_bindings binding
   where binding.content_type_version_id = p_version_id
   order by binding.id
   for update;
  perform 1
    from platform_private.cms_block_definition_versions block_row
    join platform_private.cms_schema_artifacts artifact
      on artifact.renderer_manifest is not null
    cross join lateral pg_catalog.jsonb_array_elements(
      coalesce(artifact.renderer_manifest->'blocks', '[]'::jsonb)
    ) entry(value)
   where artifact.content_type_version_id = p_version_id
     and pg_catalog.jsonb_typeof(entry.value) = 'object'
     and block_row.block_key = entry.value->>'blockKey'
     and block_row.block_version::text = entry.value->>'blockVersion'
   order by block_row.id
   for update of block_row;
  perform 1
    from platform_private.cms_block_definition_versions block_row
    join platform_private.cms_schema_artifacts artifact
      on artifact.renderer_manifest is not null
    cross join lateral pg_catalog.jsonb_array_elements(
      coalesce(artifact.renderer_manifest->'blockDefinitions', '[]'::jsonb)
    ) entry(value)
   where artifact.content_type_version_id = p_version_id
     and pg_catalog.jsonb_typeof(entry.value) = 'object'
     and block_row.block_key = entry.value->>'blockKey'
     and block_row.block_version::text = entry.value->>'blockVersion'
   order by block_row.id
   for update of block_row;
end;
$body$;

-- Lock mutable authority evidence after the dependency graph.  The single
-- order is context -> tenure -> grants -> review -> approval.  A worker has
-- no browser context payload, so it locks every currently active context for
-- the candidate author; the approval validator later requires one whose
-- persisted hash matches the review evidence.  Every multi-row lock is
-- ordered, preventing tenure/grant writers and activation from inverting a
-- review lock.
create or replace function platform_private.cms_lock_activation_authority(
  p_candidate_id uuid,
  p_actor_id uuid,
  p_context_id uuid default null
)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $body$
declare
  owner_id uuid;
  actor_person_id uuid;
begin
  select version_row.owner_id into owner_id
    from platform_private.cms_content_type_versions version_row
   where version_row.id = p_candidate_id;
  if owner_id is null then
    return;
  end if;
  actor_person_id := platform_private.identity_actor_person(p_actor_id);
  if p_context_id is not null then
    perform 1
      from platform_private.acting_context_binding context_binding
     where context_binding.id = p_context_id
     order by context_binding.id
     for update;
  else
    perform 1
      from platform_private.acting_context_binding context_binding
     where context_binding.person_id = actor_person_id
       and context_binding.acting_party_id = owner_id
       and context_binding.state = 'active'
     order by context_binding.id
     for update;
  end if;
  perform 1
    from identity_private.membership_tenure tenure
   where tenure.organization_id = owner_id
   order by tenure.id
   for update;
  perform 1
    from identity_private.organization_actor_grant actor_grant
   where actor_grant.organization_id = owner_id
   order by actor_grant.organization_id, actor_grant.person_id,
            actor_grant.capability_code
   for update;
  perform 1
    from platform_private.cfg_config_change_reviews review
   where review.candidate_type = 'setting_value'
     and review.candidate_id = p_candidate_id
   order by review.id
   for update;
  perform 1
    from platform_private.cfg_config_approvals approval
    join platform_private.cfg_config_change_reviews review
      on review.id = approval.review_id
   where review.candidate_type = 'setting_value'
     and review.candidate_id = p_candidate_id
   order by approval.review_id, approval.reviewer_person_id
   for update of approval;
end;
$body$;

-- A04 owns the plan hand-off.  An activation with an active source either
-- consumes a caller-supplied, exact dry-run plan or creates the durable
-- zero-row additive plan identified by the immutable dry-run UUID.  A plan
-- is never silently bypassed by a version-row update.
create or replace function platform_private.cms_prepare_activation_migration(
  p_candidate_id uuid,
  p_current_active_id uuid,
  p_requested_plan_id uuid,
  p_dry_run_id uuid,
  p_transform_key text default null,
  p_transform_version bigint default null,
  p_dry_run_report jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  candidate platform_private.cms_content_type_versions%rowtype;
  source_version platform_private.cms_content_type_versions%rowtype;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
  artifact_row platform_private.cms_schema_artifacts%rowtype;
  plan_id uuid;
  dry_run_report jsonb;
  now_at timestamptz := pg_catalog.clock_timestamp();
  lease_expires_at timestamptz;
begin
  if p_candidate_id is null or p_dry_run_id is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  select * into candidate
  from platform_private.cms_content_type_versions version_row
  where version_row.id = p_candidate_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if candidate.dry_run_id is distinct from p_dry_run_id
     or p_dry_run_id = candidate.id then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_current_active_id is null then
    if p_requested_plan_id is not null
       or candidate.compatibility <> 'additive' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    -- A first activation has no source version and therefore cannot create a
    -- SchemaMigrationPlan.  It must still consume an independently produced
    -- report.  Never manufacture a passing report from the candidate row:
    -- dry_run_id is an identifier, not evidence, and every count/hash/compiler
    -- value must be supplied by the dry-run producer and checked here.
    select * into artifact_row
      from platform_private.cms_schema_artifacts artifact
     where artifact.id = candidate.schema_artifact_id
       and artifact.content_type_version_id = candidate.id
       and artifact.owner_id = candidate.owner_id
       and artifact.state = 'compiled';
    if not found then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    if p_dry_run_report is not null then
      perform platform_private.cms_record_dry_run_report(
        p_dry_run_id, candidate.owner_id, candidate.content_type_id, null,
        candidate.id, 'additive', null, null, repeat('0', 64),
        candidate.definition_hash, artifact_row.artifact_hash,
        artifact_row.compiler_version, p_dry_run_report, candidate.created_by
      );
    end if;
    select report.report into dry_run_report
      from platform_private.cms_schema_dry_run_reports report
     where report.id = p_dry_run_id
       and report.target_version_id = candidate.id;
    if not found
       or artifact_row.artifact_hash is distinct from candidate.definition_hash
       or not platform_private.cms_compiler_registry_valid(
         artifact_row.compiler_version
       )
       or not platform_private.cms_persisted_dry_run_report_valid(
         p_dry_run_id, candidate.owner_id, candidate.content_type_id, null,
         candidate.id, 'additive', null, null, repeat('0', 64),
         candidate.definition_hash, artifact_row.artifact_hash,
         artifact_row.compiler_version
       )
       or not platform_private.cms_dry_run_report_valid(
         dry_run_report,
         p_dry_run_id, 'additive', null, null,
         repeat('0', 64), candidate.definition_hash,
         artifact_row.artifact_hash, artifact_row.compiler_version
       )
       or dry_run_report->>'sourceCount' is distinct from '0'
       or dry_run_report->>'targetCount' is distinct from '0'
       or dry_run_report->>'rowErrorCount' is distinct from '0'
       or dry_run_report->>'migratedCount' is distinct from '0'
       or dry_run_report->>'failedCount' is distinct from '0'
       or (p_dry_run_report is not null and p_dry_run_report is distinct from dry_run_report) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    return null;
  end if;
  select * into source_version
  from platform_private.cms_content_type_versions version_row
  where version_row.id = p_current_active_id
    and version_row.content_type_id = candidate.content_type_id
    and version_row.owner_id = candidate.owner_id
    and version_row.state = 'active'
  for update;
  if not found then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  plan_id := coalesce(p_requested_plan_id, p_dry_run_id);

  if p_requested_plan_id is null then
    select * into plan_row
    from platform_private.cms_schema_migration_plans plan
    where plan.id = plan_id
    for update;
    if found then
      if plan_row.owner_id is distinct from candidate.owner_id
         or plan_row.content_type_id is distinct from candidate.content_type_id
         or plan_row.from_version_id is distinct from source_version.id
         or plan_row.to_version_id is distinct from candidate.id
         or plan_row.classification is distinct from candidate.compatibility
         or plan_row.dry_run_report->>'dryRunId' is distinct from p_dry_run_id::text
         or not platform_private.cms_migration_plan_ready(
           plan_row.id, candidate.content_type_id, candidate.id
         ) then
        raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
      end if;
      return plan_row.id;
    end if;
    select * into artifact_row
    from platform_private.cms_schema_artifacts artifact
    where artifact.id = candidate.schema_artifact_id
      and artifact.content_type_version_id = candidate.id
      and artifact.owner_id = candidate.owner_id
      and artifact.state = 'compiled';
    if not found then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    if p_dry_run_report is not null then
      perform platform_private.cms_record_dry_run_report(
        p_dry_run_id, candidate.owner_id, candidate.content_type_id,
        source_version.id, candidate.id, candidate.compatibility,
        p_transform_key, p_transform_version, source_version.definition_hash,
        candidate.definition_hash, artifact_row.artifact_hash,
        artifact_row.compiler_version, p_dry_run_report, candidate.created_by
      );
    end if;
    select report.report into dry_run_report
      from platform_private.cms_schema_dry_run_reports report
     where report.id = p_dry_run_id
       and report.target_version_id = candidate.id;
    if not found
       or artifact_row.artifact_hash is distinct from candidate.definition_hash
       or not platform_private.cms_compiler_registry_valid(
         artifact_row.compiler_version
       ) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    if not platform_private.cms_persisted_dry_run_report_valid(
      p_dry_run_id, candidate.owner_id, candidate.content_type_id,
      source_version.id, candidate.id, candidate.compatibility,
      p_transform_key, p_transform_version, source_version.definition_hash,
      candidate.definition_hash, artifact_row.artifact_hash,
      artifact_row.compiler_version
    ) or (p_dry_run_report is not null and p_dry_run_report is distinct from dry_run_report) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    if candidate.compatibility <> 'additive' then
      if not platform_private.cms_dry_run_report_valid(
        dry_run_report,
        p_dry_run_id,
        candidate.compatibility,
        p_transform_key,
        p_transform_version,
        source_version.definition_hash,
        candidate.definition_hash,
        artifact_row.artifact_hash,
        artifact_row.compiler_version
      ) then
        raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
      end if;
      insert into platform_private.cms_schema_migration_plans(
        id, owner_id, state, version, content_type_id, from_version_id,
        to_version_id, classification, transform_key, transform_version,
        dry_run_report, cursor, progress, source_count, target_count,
        row_error_count, migrated_count, failed_count, created_by,
        created_at, updated_at, completed_at
      ) values (
        plan_id, candidate.owner_id,
        case when coalesce((dry_run_report->>'sourceCount')::bigint, 0) = 0
               and coalesce((dry_run_report->>'targetCount')::bigint, 0) = 0
               and coalesce((dry_run_report->>'rowErrorCount')::bigint, 0) = 0
               and coalesce((dry_run_report->>'migratedCount')::bigint, 0) = 0
               and coalesce((dry_run_report->>'failedCount')::bigint, 0) = 0
             then 'completed' else 'ready' end,
        1, candidate.content_type_id, source_version.id, candidate.id,
        candidate.compatibility, p_transform_key, p_transform_version,
        dry_run_report,
        coalesce((dry_run_report->>'migratedCount')::bigint, 0),
        case when coalesce((dry_run_report->>'sourceCount')::bigint, 0) = 0
             then 1 else least(1, coalesce((dry_run_report->>'migratedCount')::numeric, 0)
                              / nullif((dry_run_report->>'sourceCount')::numeric, 0)) end,
        coalesce((dry_run_report->>'sourceCount')::bigint, 0),
        coalesce((dry_run_report->>'targetCount')::bigint, 0),
        coalesce((dry_run_report->>'rowErrorCount')::bigint, 0),
        coalesce((dry_run_report->>'migratedCount')::bigint, 0),
        coalesce((dry_run_report->>'failedCount')::bigint, 0),
        candidate.created_by, now_at, now_at,
        case when coalesce((dry_run_report->>'sourceCount')::bigint, 0) = 0
               and coalesce((dry_run_report->>'targetCount')::bigint, 0) = 0
               and coalesce((dry_run_report->>'rowErrorCount')::bigint, 0) = 0
               and coalesce((dry_run_report->>'migratedCount')::bigint, 0) = 0
               and coalesce((dry_run_report->>'failedCount')::bigint, 0) = 0
             then now_at else null end
      );
      select * into plan_row
        from platform_private.cms_schema_migration_plans plan
       where plan.id = plan_id;
      if not platform_private.cms_migration_plan_ready(
        plan_row.id, candidate.content_type_id, candidate.id
      ) then
        raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
      end if;
      return plan_row.id;
    end if;
    -- An additive active-source switch is only the no-data fast path when an
    -- independently produced report proves every source/target/error count is
    -- zero.  The report is persisted in the completed plan below; this branch
    -- must never synthesize one from the two version hashes.
    if not platform_private.cms_dry_run_report_valid(
      dry_run_report,
      p_dry_run_id,
      'additive', null, null,
      source_version.definition_hash,
      candidate.definition_hash,
      artifact_row.artifact_hash,
      artifact_row.compiler_version
    )
       or dry_run_report->>'sourceCount' is distinct from '0'
       or dry_run_report->>'targetCount' is distinct from '0'
       or dry_run_report->>'rowErrorCount' is distinct from '0'
       or dry_run_report->>'migratedCount' is distinct from '0'
       or dry_run_report->>'failedCount' is distinct from '0' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    insert into platform_private.cms_schema_migration_plans(
      id, owner_id, state, version, content_type_id, from_version_id,
      to_version_id, classification, dry_run_report, cursor, progress,
      source_count, target_count, row_error_count, migrated_count,
      failed_count, created_at, updated_at, completed_at
    ) values (
      plan_id, candidate.owner_id, 'completed', 1, candidate.content_type_id,
      source_version.id, candidate.id, 'additive', dry_run_report, 0, 1,
      0, 0, 0, 0, 0, now_at, now_at, now_at
    );
    return plan_id;
  end if;

  select * into plan_row
  from platform_private.cms_schema_migration_plans plan
  where plan.id = p_requested_plan_id
  for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.owner_id is distinct from candidate.owner_id
     or plan_row.content_type_id is distinct from candidate.content_type_id
     or plan_row.from_version_id is distinct from source_version.id
     or plan_row.to_version_id is distinct from candidate.id
     or plan_row.classification is distinct from candidate.compatibility
     or plan_row.dry_run_report->>'dryRunId' is distinct from p_dry_run_id::text
     or not platform_private.cms_migration_plan_ready(
       plan_row.id, candidate.content_type_id, candidate.id
     ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if plan_row.state = 'ready' then
    if plan_row.source_count <> 0
       or plan_row.target_count <> 0
       or plan_row.row_error_count <> 0
       or plan_row.migrated_count <> 0
       or plan_row.failed_count <> 0
       or plan_row.cursor < plan_row.source_count then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    begin
      lease_expires_at := (plan_row.dry_run_report->'lease'->>'expiresAt')::timestamptz;
    exception when others then
      lease_expires_at := null;
    end;
    update platform_private.cms_schema_migration_plans plan
    set state = 'completed',
        version = plan.version + 1,
        updated_at = now_at,
        completed_at = now_at,
        dry_run_report = platform_private.cms_worker_set_report(
          plan.dry_run_report, 'completed', null, null,
          greatest(coalesce(lease_expires_at, now_at), now_at + interval '15 minutes'),
          plan.source_count, plan.target_count, plan.row_error_count,
          plan.migrated_count, plan.failed_count
        )
    where plan.id = plan_row.id and plan.version = plan_row.version;
    if not found then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
  end if;
  return plan_row.id;
end;
$body$;

create or replace function platform_private.cms_create_type_draft(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor_id uuid;
  acting_party_id uuid;
  correlation_id uuid;
  reservation platform_private.idempotency_records;
  type_id uuid := extensions.gen_random_uuid();
  version_id uuid := extensions.gen_random_uuid();
  artifact_id uuid := extensions.gen_random_uuid();
  dry_run_id uuid := extensions.gen_random_uuid();
  field_input jsonb;
  relation_input jsonb;
  binding_input jsonb;
  capability_input jsonb;
  field_id uuid;
  response jsonb;
  definition_hash text;
  transform_hash text;
  dry_run_report jsonb;
begin
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  actor_id := platform_private.cms_actor(p_request);
  acting_party_id := platform_private.cms_acting_party(p_request, actor_id);
  perform platform_private.cms_require_capability(actor_id, acting_party_id, 'cms.schema_designer');
  correlation_id := platform_private.cms_correlation(p_request);
  reservation := platform_private.cms_reserve(p_request, actor_id, 'CMS-03A-01');
  if reservation.state = 'completed'::platform_private.idempotency_state then
    if reservation.response_ref->'safeHeaders' ? 'response' then
      return reservation.response_ref->'safeHeaders'->'response';
    end if;
    return platform_private.cms_type_version_resource((reservation.response_ref->>'resourceRef')::uuid);
  end if;
  if not platform_private.cms_exact_keys(
    p_request,
    array['typeKey','label','ownerCapability','sourceLocale','defaultLocale','workflowKey','workflowVersion','defaultTemplateVersionId','fields','relations','templateBindings','capabilityBindings']::text[],
    array['typeKey','label','ownerCapability','sourceLocale','defaultLocale','workflowKey','workflowVersion','defaultTemplateVersionId','fields','relations','templateBindings','capabilityBindings','idempotencyKey','context','correlationId']::text[]
  ) then raise exception 'INVALID_REQUEST' using errcode = 'P0001'; end if;
  if p_request->>'typeKey' !~ '^[a-z][a-z0-9_]{1,63}$'
     or platform_private.cms_reserved_key(p_request->>'typeKey')
     or p_request->>'label' is null
     or pg_catalog.length(pg_catalog.normalize(p_request->>'label', 'NFC')) not between 2 and 120
     or p_request->>'ownerCapability' !~ '^[a-z][a-z0-9._-]{0,127}$'
     or not platform_private.cms_capability_registry_valid(p_request->>'ownerCapability', null)
     or p_request->>'workflowKey' !~ '^[a-z][a-z0-9._-]{0,127}$'
     or not platform_private.cms_valid_version(p_request->>'workflowVersion')
     or not platform_private.cms_workflow_registry_valid(
       p_request->>'workflowKey',
       case when platform_private.cms_valid_version(p_request->>'workflowVersion')
         then (p_request->>'workflowVersion')::bigint else null end
     )
     or pg_catalog.jsonb_typeof(p_request->'fields') is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_request->'fields') > 128
     or pg_catalog.jsonb_typeof(p_request->'relations') is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_request->'relations') > 128
     or pg_catalog.jsonb_typeof(p_request->'templateBindings') is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_request->'templateBindings') > 32
     or pg_catalog.jsonb_typeof(p_request->'capabilityBindings') is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_request->'capabilityBindings') > 32 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_request ? 'defaultTemplateVersionId'
     and p_request->'defaultTemplateVersionId' <> 'null'::jsonb
     and (
       not platform_private.cms_valid_uuid(p_request->>'defaultTemplateVersionId')
       or not platform_private.cms_template_registry_valid(
         (p_request->>'defaultTemplateVersionId')::uuid
       )
     ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if exists (select 1 from platform_private.cms_content_types where type_key = p_request->>'typeKey') then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  definition_hash := platform_private.cms_definition_artifact_hash(p_request);
  insert into platform_private.cms_content_types(
    id, owner_id, state, version, type_key, owner_capability, created_by
  ) values (type_id, acting_party_id, 'retired', 1, p_request->>'typeKey', p_request->>'ownerCapability', actor_id);
  insert into platform_private.cms_content_type_versions(
    id, owner_id, state, version, content_type_id, version_no, labels,
    workflow_key, workflow_version, source_locale, default_locale,
    default_template_version_id, schema_artifact_id, definition_hash,
    compatibility, dry_run_id, created_by
  ) values (
    version_id, acting_party_id, 'draft', 1, type_id, 1,
    jsonb_build_object('label', pg_catalog.normalize(p_request->>'label', 'NFC')),
    p_request->>'workflowKey', (p_request->>'workflowVersion')::bigint,
    p_request->>'sourceLocale', p_request->>'defaultLocale',
    nullif(p_request->>'defaultTemplateVersionId', '')::uuid, artifact_id,
    definition_hash, 'additive', dry_run_id, actor_id
  );
  insert into platform_private.cms_schema_artifacts(
    id, owner_id, state, version, content_type_version_id, compiler_version,
    zod_contract_ref, editor_manifest, renderer_manifest, artifact_hash, compiled_at
  ) values (
    artifact_id, acting_party_id, 'compiled', 1, version_id, '1',
    'cms/content-type/' || (p_request->>'typeKey') || '/v1',
    platform_private.cms_compiled_editor_manifest(p_request),
    platform_private.cms_compiled_renderer_manifest(p_request), definition_hash, now()
  );
  for field_input in select value from jsonb_array_elements(p_request->'fields') as value loop
    if not platform_private.cms_valid_field_input(field_input, true) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    field_id := (field_input->>'stableFieldId')::uuid;
    insert into platform_private.cms_field_definition_versions(
      id, owner_id, state, version, content_type_version_id, stable_field_id,
      field_key, kind, constraints, validator_key, validator_version, required,
      default_mode, default_value, localization_mode, editor_config, created_by
    ) values (
      field_id, acting_party_id, coalesce(nullif(field_input->>'lifecycle', ''), 'active'), 1,
      version_id, field_id, field_input->>'key', field_input->>'kind',
      coalesce(field_input->'constraints', '{}'::jsonb), nullif(field_input->>'validatorKey', '') ,
      nullif(field_input->>'validatorVersion', '')::bigint, coalesce((field_input->>'required')::boolean, false),
      coalesce(nullif(field_input->>'defaultMode', ''), 'none'), field_input->'defaultValue',
      coalesce(nullif(field_input->>'localizationMode', ''), 'none'),
      coalesce(field_input->'editorConfig', '{}'::jsonb), actor_id
    );
  end loop;
  for relation_input in select value from jsonb_array_elements(p_request->'relations') as value loop
    if not platform_private.cms_valid_relation_input(relation_input)
       or not exists (
         select 1
         from platform_private.cms_field_definition_versions field
         where field.id = (relation_input->>'fieldId')::uuid
           and field.content_type_version_id = version_id
           and field.kind = 'relation'
       ) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    insert into platform_private.cms_relation_definitions(
      owner_id, state, version, field_definition_id,
      target_kind, target_type, projection_key, cardinality, min_count, max_count,
      ordered, on_unavailable, created_by
    )
    select acting_party_id, 'draft', 1, (relation_input->>'fieldId')::uuid,
      relation_input->>'targetKind', relation_input->>'targetType', relation_input->>'projectionKey',
      relation_input->>'cardinality', (relation_input->>'min')::integer, (relation_input->>'max')::integer,
      coalesce((relation_input->>'ordered')::boolean, false), relation_input->>'onUnavailable', actor_id;
  end loop;
  for binding_input in select value from jsonb_array_elements(p_request->'templateBindings') as value loop
    if not platform_private.cms_exact_keys(
      binding_input,
      array['templateVersionId']::text[],
      array['templateVersionId']::text[]
    ) or not platform_private.cms_valid_uuid(binding_input->>'templateVersionId')
      or not platform_private.cms_template_registry_valid(
        case when platform_private.cms_valid_uuid(binding_input->>'templateVersionId')
          then (binding_input->>'templateVersionId')::uuid else null end
      ) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    insert into platform_private.cms_content_type_template_bindings(
      owner_id, state, version, content_type_version_id, template_version_id, position
    ) values (
      acting_party_id, 'draft', 1, version_id, (binding_input->>'templateVersionId')::uuid,
      coalesce((binding_input->>'position')::integer, 0)
    );
  end loop;
  for capability_input in select value from jsonb_array_elements(p_request->'capabilityBindings') as value loop
    if not platform_private.cms_exact_keys(
      capability_input,
      array['capabilityKey','capabilityVersion']::text[],
      array['capabilityKey','capabilityVersion']::text[]
    ) or capability_input->>'capabilityKey' !~ '^[a-z][a-z0-9._-]{0,127}$'
      or not platform_private.cms_capability_registry_valid(
        capability_input->>'capabilityKey',
        case when platform_private.cms_valid_version(capability_input->>'capabilityVersion')
          then (capability_input->>'capabilityVersion')::bigint else null end
      )
      or not platform_private.cms_valid_version(capability_input->>'capabilityVersion') then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    insert into platform_private.cms_content_type_capability_bindings(
      owner_id, state, version, content_type_version_id, capability_key, capability_version
    ) values (
      acting_party_id, 'draft', 1, version_id, capability_input->>'capabilityKey',
      (capability_input->>'capabilityVersion')::bigint
    );
  end loop;
  -- Persist first-activation evidence with the compiled draft.  The report is
  -- immutable and separately bound to the target version; later activation
  -- must consume this row (or a newer worker-produced row), never recreate a
  -- pass result from the candidate UUID/hash alone.
  transform_hash := platform_private.cms_migration_transform_hash(
    'additive', null, null, repeat('0', 64), definition_hash,
    definition_hash, '1'
  );
  dry_run_report := jsonb_build_object(
    'dryRunId', dry_run_id, 'result', 'pass',
    'sourceHash', repeat('0', 64), 'targetHash', definition_hash,
    'transformHash', transform_hash, 'compilerHash', definition_hash,
    'compilerVersion', '1', 'sourceCount', '0', 'targetCount', '0',
    'rowErrorCount', '0', 'migratedCount', '0', 'failedCount', '0',
    'lease', jsonb_build_object(
      'state', 'completed', 'owner', null, 'token', null,
      'expiresAt', pg_catalog.clock_timestamp() + interval '15 minutes'
    )
  );
  perform platform_private.cms_record_dry_run_report(
    dry_run_id, acting_party_id, type_id, null, version_id, 'additive',
    null, null, repeat('0', 64), definition_hash, definition_hash, '1',
    dry_run_report, actor_id
  );
  perform platform_private.cms_emit_event(
    'cms.schema.draft.create', actor_id, acting_party_id, 'cms_content_type_version',
    version_id, 'CMS_SCHEMA_DRAFT_CREATED', 'cms.schema.draft.created.v1',
    'cms_content_type_version', version_id, 1,
    jsonb_build_object(
      'contentTypeId', type_id, 'schemaVersionId', version_id,
      'typeKey', p_request->>'typeKey', 'version', '1'
    ), correlation_id
  );
  response := platform_private.cms_type_version_resource(version_id);
  perform platform_private.cms_complete(reservation.id, version_id, 201, response);
  return response;
end;
$body$;

create or replace function platform_private.cms_add_field_definition(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor_id uuid;
  acting_party_id uuid;
  correlation_id uuid;
  reservation platform_private.idempotency_records;
  type_version platform_private.cms_content_type_versions%rowtype;
  field_id uuid;
  field_input jsonb := p_request->'field';
  field_row platform_private.cms_field_definition_versions%rowtype;
  response jsonb;
  expected_version bigint;
begin
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  actor_id := platform_private.cms_actor(p_request);
  acting_party_id := platform_private.cms_acting_party(p_request, actor_id);
  perform platform_private.cms_require_capability(actor_id, acting_party_id, 'cms.schema_designer');
  correlation_id := platform_private.cms_correlation(p_request);
  reservation := platform_private.cms_reserve(p_request, actor_id, 'CMS-03A-02:' || coalesce(p_request->>'contentTypeId', ''));
  if reservation.state = 'completed'::platform_private.idempotency_state then
    if reservation.response_ref->'safeHeaders' ? 'response' then
      return reservation.response_ref->'safeHeaders'->'response';
    end if;
    return jsonb_build_object('resourceKind', 'field_definition_version', 'id', (reservation.response_ref->>'resourceRef')::uuid);
  end if;
  expected_version := platform_private.cms_expected_version(p_request);
  if not platform_private.cms_exact_keys(
    p_request,
    array['contentTypeId','versionId','field','migrationPlanId','expectedVersion']::text[],
    array['contentTypeId','versionId','field','migrationPlanId','expectedVersion','ifMatch','idempotencyKey','context','correlationId']::text[]
  )
     or not platform_private.cms_valid_uuid(p_request->>'contentTypeId')
     or not platform_private.cms_valid_uuid(p_request->>'versionId')
     or pg_catalog.jsonb_typeof(field_input) is distinct from 'object'
     or not (p_request ? 'migrationPlanId')
     or (p_request->'migrationPlanId' <> 'null'::jsonb and not platform_private.cms_valid_uuid(p_request->>'migrationPlanId')) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into type_version
  from platform_private.cms_content_type_versions
  where id = (p_request->>'versionId')::uuid
    and content_type_id = (p_request->>'contentTypeId')::uuid
    and owner_id = acting_party_id
  for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if p_request->'migrationPlanId' <> 'null'::jsonb
     and not platform_private.cms_migration_plan_ready(
       (p_request->>'migrationPlanId')::uuid,
       type_version.content_type_id,
       type_version.id
     ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if type_version.state <> 'draft' or type_version.version <> expected_version then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if not platform_private.cms_valid_field_input(field_input, false) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  field_id := nullif(field_input->>'stableFieldId', '')::uuid;
  if field_id is null then
    field_id := extensions.gen_random_uuid();
    if exists (select 1 from platform_private.cms_field_definition_versions where content_type_version_id = type_version.id and field_key = field_input->>'key') then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    insert into platform_private.cms_field_definition_versions(
      id, owner_id, state, version, content_type_version_id, stable_field_id,
      field_key, kind, constraints, validator_key, validator_version, required,
      default_mode, default_value, localization_mode, editor_config, created_by
    ) values (
      field_id, type_version.owner_id, coalesce(nullif(field_input->>'lifecycle', ''), 'active'),
      1, type_version.id, field_id, field_input->>'key', field_input->>'kind',
      coalesce(field_input->'constraints', '{}'::jsonb), nullif(field_input->>'validatorKey', ''),
      nullif(field_input->>'validatorVersion', '')::bigint, coalesce((field_input->>'required')::boolean, false),
      coalesce(nullif(field_input->>'defaultMode', ''), 'none'), field_input->'defaultValue',
      coalesce(nullif(field_input->>'localizationMode', ''), 'none'), coalesce(field_input->'editorConfig', '{}'::jsonb), actor_id
    );
  else
    select * into field_row from platform_private.cms_field_definition_versions
    where content_type_version_id = type_version.id and stable_field_id = field_id for update;
    if not found or field_row.field_key is distinct from field_input->>'key' then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    if p_request->'migrationPlanId' = 'null'::jsonb
       and (
         field_row.kind is distinct from field_input->>'kind'
         or (not field_row.required and (field_input->>'required')::boolean)
         or field_row.constraints is distinct from field_input->'constraints'
         or field_row.default_mode is distinct from field_input->>'defaultMode'
         or field_row.localization_mode is distinct from field_input->>'localizationMode'
         or field_row.state is distinct from field_input->>'lifecycle'
       ) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    update platform_private.cms_field_definition_versions
    set state = coalesce(nullif(field_input->>'lifecycle', ''), state),
        version = version + 1,
        updated_at = now(),
        kind = field_input->>'kind',
        constraints = coalesce(field_input->'constraints', '{}'::jsonb),
        validator_key = nullif(field_input->>'validatorKey', ''),
        validator_version = nullif(field_input->>'validatorVersion', '')::bigint,
        required = coalesce((field_input->>'required')::boolean, false),
        default_mode = coalesce(nullif(field_input->>'defaultMode', ''), 'none'),
        default_value = field_input->'defaultValue',
        localization_mode = coalesce(nullif(field_input->>'localizationMode', ''), 'none'),
        editor_config = coalesce(field_input->'editorConfig', '{}'::jsonb)
    where id = field_id;
  end if;
  update platform_private.cms_content_type_versions
  set version = version + 1, updated_at = now()
  where id = type_version.id and version = expected_version;
  if not found then raise exception 'CONFLICT' using errcode = 'P0001'; end if;
  perform platform_private.cms_record_audit(
    'cms.schema.field.change', actor_id, acting_party_id, 'cms_field_definition_version',
    field_id, 'CMS_FIELD_SCHEMA_CHANGED', correlation_id
  );
  select jsonb_build_object(
    'resourceKind', 'field_definition_version', 'id', field.id, 'version', field.version::text,
    'contentHash', encode(extensions.digest(convert_to(field::text, 'utf8'), 'sha256'), 'hex'),
    'createdAt', field.created_at, 'updatedAt', field.updated_at,
    'contentTypeVersionId', field.content_type_version_id, 'stableFieldId', field.stable_field_id,
    'key', field.field_key, 'kind', field.kind, 'required', field.required,
    'validatorKey', field.validator_key, 'validatorVersion', field.validator_version::text,
    'defaultMode', field.default_mode, 'localizationMode', field.localization_mode,
    'lifecycle', field.state, 'migrationPlanId', nullif(p_request->>'migrationPlanId', '')::uuid
  ) into response from platform_private.cms_field_definition_versions field where field.id = field_id;
  perform platform_private.cms_complete(reservation.id, field_id, 201, response);
  return response;
end;
$body$;

create or replace function platform_private.cms_bind_relation(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor_id uuid;
  acting_party_id uuid;
  correlation_id uuid;
  reservation platform_private.idempotency_records;
  type_version platform_private.cms_content_type_versions%rowtype;
  field_row platform_private.cms_field_definition_versions%rowtype;
  relation_id uuid;
  expected_version bigint;
  response jsonb;
begin
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  actor_id := platform_private.cms_actor(p_request);
  acting_party_id := platform_private.cms_acting_party(p_request, actor_id);
  perform platform_private.cms_require_capability(actor_id, acting_party_id, 'cms.schema_designer');
  correlation_id := platform_private.cms_correlation(p_request);
  reservation := platform_private.cms_reserve(p_request, actor_id, 'CMS-03A-03:' || coalesce(p_request->>'versionId', ''));
  if reservation.state = 'completed'::platform_private.idempotency_state then
    if reservation.response_ref->'safeHeaders' ? 'response' then
      return reservation.response_ref->'safeHeaders'->'response';
    end if;
    return jsonb_build_object('resourceKind', 'relation_definition', 'id', (reservation.response_ref->>'resourceRef')::uuid);
  end if;
  expected_version := platform_private.cms_expected_version(p_request);
  if not platform_private.cms_exact_keys(
    p_request,
    array['contentTypeId','versionId','fieldId','targetKind','targetType','projectionKey','cardinality','min','max','ordered','onUnavailable','expectedVersion']::text[],
    array['contentTypeId','versionId','fieldId','targetKind','targetType','projectionKey','cardinality','min','max','ordered','onUnavailable','expectedVersion','ifMatch','idempotencyKey','context','correlationId']::text[]
  )
     or not platform_private.cms_valid_uuid(p_request->>'contentTypeId')
     or not platform_private.cms_valid_uuid(p_request->>'versionId')
     or not platform_private.cms_valid_relation_input(
       jsonb_build_object(
         'fieldId', p_request->>'fieldId',
         'targetKind', p_request->>'targetKind',
         'targetType', p_request->>'targetType',
         'projectionKey', p_request->>'projectionKey',
         'cardinality', p_request->>'cardinality',
         'min', p_request->>'min',
         'max', p_request->>'max',
         'ordered', p_request->'ordered',
         'onUnavailable', p_request->>'onUnavailable'
       )
     ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  select * into type_version from platform_private.cms_content_type_versions
  where id = (p_request->>'versionId')::uuid
    and content_type_id = (p_request->>'contentTypeId')::uuid
    and owner_id = acting_party_id
  for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if type_version.state <> 'draft' or type_version.version <> expected_version then raise exception 'CONFLICT' using errcode = 'P0001'; end if;
  select * into field_row from platform_private.cms_field_definition_versions
  where id = (p_request->>'fieldId')::uuid and content_type_version_id = type_version.id for update;
  if not found or field_row.kind <> 'relation' then raise exception 'VALIDATION_FAILED' using errcode = 'P0001'; end if;
  if (p_request->>'min')::integer > (p_request->>'max')::integer
     or (p_request->>'min')::integer > 128 or (p_request->>'max')::integer > 128
     or (p_request->>'cardinality' = 'one' and ((p_request->>'max')::integer <> 1 or (p_request->>'min')::integer not in (0, 1))) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  insert into platform_private.cms_relation_definitions(
    owner_id, state, version, field_definition_id, target_kind, target_type,
    projection_key, cardinality, min_count, max_count, ordered, on_unavailable, created_by
  ) values (
    type_version.owner_id, 'draft', 1, field_row.id, p_request->>'targetKind',
    p_request->>'targetType', p_request->>'projectionKey', p_request->>'cardinality',
    (p_request->>'min')::integer, (p_request->>'max')::integer,
    coalesce((p_request->>'ordered')::boolean, false), p_request->>'onUnavailable', actor_id
  ) returning id into relation_id;
  update platform_private.cms_content_type_versions set version = version + 1, updated_at = now()
  where id = type_version.id and version = expected_version;
  if not found then raise exception 'CONFLICT' using errcode = 'P0001'; end if;
  perform platform_private.cms_record_audit(
    'cms.schema.relation.bind', actor_id, acting_party_id, 'cms_relation_definition',
    relation_id, 'CMS_RELATION_BOUND', correlation_id
  );
  select jsonb_build_object(
    'resourceKind', 'relation_definition', 'id', relation.id, 'version', relation.version::text,
    'contentHash', encode(extensions.digest(convert_to(relation::text, 'utf8'), 'sha256'), 'hex'),
    'createdAt', relation.created_at, 'updatedAt', relation.updated_at,
    'contentTypeVersionId', type_version.id, 'fieldId', relation.field_definition_id,
    'targetKind', relation.target_kind, 'targetType', relation.target_type,
    'projectionKey', relation.projection_key, 'cardinality', relation.cardinality,
    'min', relation.min_count, 'max', relation.max_count, 'ordered', relation.ordered,
    'onUnavailable', relation.on_unavailable
  ) into response from platform_private.cms_relation_definitions relation where relation.id = relation_id;
  perform platform_private.cms_complete(reservation.id, relation_id, 201, response);
  return response;
end;
$body$;

create or replace function platform_private.cms_activate_schema(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
<<activation_block>>
declare
  actor_id uuid;
  acting_party_id uuid;
  correlation_id uuid;
  reservation platform_private.idempotency_records;
  candidate platform_private.cms_content_type_versions%rowtype;
  current_active platform_private.cms_content_type_versions%rowtype;
  expected_version bigint;
  approval_count integer;
  required_decision_count integer;
  approval_evidence_count integer;
  distinct_approver_count integer;
  resolved_review_count integer;
  approval_ids uuid[];
  required_capabilities jsonb;
  mfa_context_id uuid;
  validation_at timestamptz;
  policy_hash text;
  approval_hash text;
  activation_evidence_hash text;
  risk_class text;
  migration_plan_id uuid;
  event_id uuid;
  response jsonb;
begin
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  actor_id := platform_private.cms_actor(p_request);
  acting_party_id := platform_private.cms_acting_party(p_request, actor_id);
  perform platform_private.cms_require_capability(actor_id, acting_party_id, 'cms.schema_designer');
  correlation_id := platform_private.cms_correlation(p_request);
  reservation := platform_private.cms_reserve(p_request, actor_id, 'CMS-03A-04:' || coalesce(p_request->>'versionId', ''));
  if reservation.state = 'completed'::platform_private.idempotency_state then
    if reservation.response_ref->'safeHeaders' ? 'response' then
      return reservation.response_ref->'safeHeaders'->'response';
    end if;
    return jsonb_build_object('state', 'active', 'contentTypeVersionId', (reservation.response_ref->>'resourceRef')::uuid, 'eventType', 'cms.schema.activated.v1');
  end if;
  if not platform_private.cms_exact_keys(
    p_request,
    array['contentTypeId','versionId','expectedVersion','dryRunId','approvalIds','migrationPlanId']::text[],
    array['contentTypeId','versionId','expectedVersion','dryRunId','approvalIds','migrationPlanId','expectedActivationEvidenceHash','idempotencyKey','ifMatch','context','correlationId']::text[]
  ) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  expected_version := platform_private.cms_expected_version(p_request);
  if not platform_private.cms_valid_uuid(p_request->>'contentTypeId')
     or not platform_private.cms_valid_uuid(p_request->>'versionId')
     or not platform_private.cms_valid_uuid(p_request->>'dryRunId')
     or pg_catalog.jsonb_typeof(p_request->'approvalIds') is distinct from 'array'
     or pg_catalog.jsonb_array_length(p_request->'approvalIds') not between 1 and 8 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into candidate from platform_private.cms_content_type_versions
  where id = (p_request->>'versionId')::uuid
    and content_type_id = (p_request->>'contentTypeId')::uuid
    and owner_id = acting_party_id
  for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  risk_class := platform_private.cms_activation_risk_class(candidate.workflow_key);
  perform platform_private.cms_lock_activation_graph(candidate.id);
  if candidate.state <> 'approved' or candidate.version <> expected_version then raise exception 'CONFLICT' using errcode = 'P0001'; end if;
  if candidate.dry_run_id is distinct from (p_request->>'dryRunId')::uuid then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if not exists (
    select 1
    from platform_private.cms_schema_artifacts artifact
    where artifact.id = candidate.schema_artifact_id
      and artifact.content_type_version_id = candidate.id
      and artifact.artifact_hash = candidate.definition_hash
      and artifact.state = 'compiled'
  ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  current_active := null;
  select * into current_active
  from platform_private.cms_content_type_versions active_version
  where active_version.content_type_id = candidate.content_type_id
    and active_version.owner_id = candidate.owner_id
    and active_version.state = 'active'
    and active_version.id <> candidate.id
  order by active_version.id
  for update;
  if exists (
    select 1 from jsonb_array_elements_text(p_request->'approvalIds') a
    where not platform_private.cms_valid_uuid(a)
  ) or (select count(distinct value) from jsonb_array_elements_text(p_request->'approvalIds') value) <> jsonb_array_length(p_request->'approvalIds') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if candidate.compatibility in ('conditional', 'breaking') and nullif(p_request->>'migrationPlanId', '') is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_request->'migrationPlanId' <> 'null'::jsonb then
    if not platform_private.cms_valid_uuid(p_request->>'migrationPlanId') then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    if not platform_private.cms_migration_plan_ready(
      (p_request->>'migrationPlanId')::uuid,
      candidate.content_type_id,
      candidate.id
    ) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  end if;
  select array_agg(value::uuid order by value::uuid) into approval_ids
  from jsonb_array_elements_text(p_request->'approvalIds') as approval(value);
  required_decision_count := coalesce(
    candidate.activation_required_decision_count::integer,
    case when candidate.workflow_key in ('protected', 'high-risk', 'high_risk') then 2 else 1 end
  );
  required_capabilities := coalesce(
    candidate.activation_required_capabilities,
    jsonb_build_array('cms.schema_designer')
  );
  policy_hash := coalesce(
    candidate.activation_workflow_policy_hash,
    encode(extensions.digest(convert_to('cms.schema.activate:1', 'utf8'), 'sha256'), 'hex')
  );
  if required_decision_count not between 1 and 8
     or pg_catalog.jsonb_typeof(required_capabilities) <> 'array'
     or pg_catalog.jsonb_array_length(required_capabilities) not between 1 and 16
     or policy_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  -- The request carries only opaque review IDs.  Approval, capability, and
  -- recent-MFA evidence is resolved from the immutable configuration review
  -- authority; caller-supplied step-up booleans/timestamps are ignored.
  if not platform_private.cms_exact_keys(
    p_request->'context',
    array['actingContextId']::text[],
    array['actingContextId']::text[]
  ) or not platform_private.cms_valid_uuid(p_request->'context'->>'actingContextId') then
    raise exception 'STEP_UP_REQUIRED' using errcode = 'P0001';
  end if;
  mfa_context_id := (p_request->'context'->>'actingContextId')::uuid;
  perform platform_private.cms_lock_activation_authority(
    candidate.id, actor_id, mfa_context_id
  );
  validation_at := pg_catalog.clock_timestamp();
  if not exists (
    select 1
    from platform_private.acting_context_binding context_binding
    where context_binding.id = mfa_context_id
      and context_binding.person_id = platform_private.identity_actor_person(actor_id)
      and context_binding.acting_party_id = candidate.owner_id
      and context_binding.state = 'active'
      and context_binding.expires_at > validation_at
      and context_binding.last_seen_at >= validation_at - interval '10 minutes'
  ) then
    raise exception 'STEP_UP_REQUIRED' using errcode = 'P0001';
  end if;
  select coalesce(max(review.required_approvals), 1) into required_decision_count
  from platform_private.cfg_config_change_reviews review
  where review.id = any(approval_ids)
    and review.candidate_type = 'setting_value'
    and review.candidate_id = candidate.id
    and review.candidate_version = candidate.version
    and review.frozen_hash = candidate.definition_hash
    and review.state = 'approved'
    and review.risk_class in ('high', 'emergency')
    and review.submitted_by = actor_id
    and review.effective_context_hash = platform_private.cfg_hash_json(p_request->'context')
    and review.submitted_at >= validation_at - interval '10 minutes'
    and review.submitted_at <= validation_at;
  required_capabilities := jsonb_build_array('cms.schema_designer');
  policy_hash := encode(extensions.digest(convert_to(
    'cms.schema.activate:1:' || required_decision_count || ':' || required_capabilities::text,
    'utf8'
  ), 'sha256'), 'hex');
  if risk_class = 'protected' and required_decision_count < 2 then
    raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
  end if;
  -- Resolve the supplied opaque review IDs through the same evidence set used
  -- for the count and digest.  An unknown, extra, or otherwise ineligible ID
  -- must not disappear from the request while the remaining approvals pass.
  select count(*), count(distinct approval.reviewer_person_id),
         count(distinct approval.review_id)
    into approval_evidence_count, distinct_approver_count, resolved_review_count
  from platform_private.cfg_config_approvals approval
  join platform_private.cfg_config_change_reviews review on review.id = approval.review_id
  where approval.review_id = any(approval_ids)
    and approval.decision = 'approve'
    and approval.reviewed_hash = candidate.definition_hash
    and approval.capability = any(select jsonb_array_elements_text(required_capabilities))
    and approval.decided_at <= validation_at
    and approval.decided_at >= validation_at - interval '10 minutes'
    and approval.reviewer_person_id <> actor_id
    and approval.review_version = review.version_no
    and review.candidate_type = 'setting_value'
    and review.candidate_id = candidate.id
    and review.candidate_version = candidate.version
    and review.frozen_hash = candidate.definition_hash
    and review.state = 'approved'
    and review.risk_class in ('high', 'emergency')
    and review.submitted_by = actor_id
    and review.effective_context_hash = platform_private.cfg_hash_json(p_request->'context')
    and review.submitted_at >= validation_at - interval '10 minutes'
    and review.submitted_at <= validation_at
    and exists (
      select 1
      from platform_private.acting_context_binding context_binding
      where context_binding.id = mfa_context_id
        and context_binding.person_id = platform_private.identity_actor_person(actor_id)
        and context_binding.acting_party_id = candidate.owner_id
        and context_binding.state = 'active'
        and context_binding.expires_at > validation_at
        and context_binding.last_seen_at >= validation_at - interval '10 minutes'
    )
    and exists (
      select 1
      from identity_private.membership_tenure tenure
      join identity_private.organization_actor_grant actor_grant
        on actor_grant.organization_id = tenure.organization_id
       and actor_grant.person_id = tenure.person_id
      where tenure.organization_id = candidate.owner_id
        and tenure.person_id = platform_private.identity_actor_person(approval.reviewer_person_id)
        and tenure.state = 'confirmed'
        and (tenure.ends_on is null or tenure.ends_on >= current_date)
        and actor_grant.capability_code = approval.capability
        and actor_grant.active
        and actor_grant.valid_from <= current_date
        and (actor_grant.valid_through is null or actor_grant.valid_through >= current_date)
    );
  if resolved_review_count <> cardinality(approval_ids)
     or distinct_approver_count <> approval_evidence_count
     or approval_evidence_count < required_decision_count then
    raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
  end if;
  select encode(extensions.digest(convert_to(
    coalesce(jsonb_agg(jsonb_build_object(
      'reviewId', approval.review_id,
      'reviewerAuthUserId', approval.reviewer_person_id,
      'capability', approval.capability,
      'reviewedHash', approval.reviewed_hash,
      'reviewVersion', approval.review_version,
      'decidedAt', approval.decided_at
    ) order by approval.review_id, approval.reviewer_person_id)::text, '[]'), 'utf8'),
    'sha256'
  ), 'hex') into approval_hash
  from platform_private.cfg_config_approvals approval
  join platform_private.cfg_config_change_reviews review
    on review.id = approval.review_id
  where approval.review_id = any(approval_ids)
    and approval.decision = 'approve'
    and approval.reviewed_hash = candidate.definition_hash
    and approval.capability = any(select jsonb_array_elements_text(required_capabilities))
    and approval.decided_at <= validation_at
    and approval.decided_at >= validation_at - interval '10 minutes'
    and approval.reviewer_person_id <> actor_id
    and approval.review_version = review.version_no
    and review.candidate_type = 'setting_value'
    and review.candidate_id = candidate.id
    and review.candidate_version = candidate.version
    and review.frozen_hash = candidate.definition_hash
    and review.state = 'approved'
    and review.risk_class in ('high', 'emergency')
    and review.submitted_by = actor_id
    and review.effective_context_hash = platform_private.cfg_hash_json(p_request->'context')
    and review.submitted_at >= validation_at - interval '10 minutes'
    and review.submitted_at <= validation_at
    and exists (
      select 1
      from platform_private.acting_context_binding context_binding
      where context_binding.id = mfa_context_id
        and context_binding.person_id = platform_private.identity_actor_person(actor_id)
        and context_binding.acting_party_id = candidate.owner_id
        and context_binding.state = 'active'
        and context_binding.expires_at > validation_at
        and context_binding.last_seen_at >= validation_at - interval '10 minutes'
    )
    and exists (
      select 1
      from identity_private.membership_tenure tenure
      join identity_private.organization_actor_grant actor_grant
        on actor_grant.organization_id = tenure.organization_id
       and actor_grant.person_id = tenure.person_id
      where tenure.organization_id = candidate.owner_id
        and tenure.person_id = platform_private.identity_actor_person(approval.reviewer_person_id)
        and tenure.state = 'confirmed'
        and (tenure.ends_on is null or tenure.ends_on >= current_date)
        and actor_grant.capability_code = approval.capability
        and actor_grant.active
        and actor_grant.valid_from <= current_date
        and (actor_grant.valid_through is null or actor_grant.valid_through >= current_date)
    );
  approval_count := required_decision_count;
  activation_evidence_hash := encode(extensions.digest(convert_to(jsonb_build_object(
    'key', 'cms.schema.activate', 'version', '1', 'policyHash', policy_hash,
    'riskClass', risk_class,
    'requiredDecisionCount', approval_count,
    'requiredCapabilities', jsonb_build_array('cms.schema_designer'),
    'approvalEvidenceHash', approval_hash
  )::text, 'utf8'), 'sha256'), 'hex');
  if p_request ? 'expectedActivationEvidenceHash'
     and p_request->'expectedActivationEvidenceHash' <> 'null'::jsonb
     and p_request->>'expectedActivationEvidenceHash' <> activation_evidence_hash then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  -- Re-read the active pointer after the approval checks.  This closes the
  -- gap where another activation can supersede the row observed at the start
  -- of this transaction while this candidate is being reviewed.
  current_active := null;
  select * into current_active
  from platform_private.cms_content_type_versions active_version
  where active_version.content_type_id = candidate.content_type_id
    and active_version.owner_id = candidate.owner_id
    and active_version.state = 'active'
    and active_version.id <> candidate.id
  order by active_version.id
  for update;
  if not platform_private.cms_activation_references_valid(candidate.id) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  migration_plan_id := platform_private.cms_prepare_activation_migration(
    candidate.id,
    current_active.id,
    case when p_request->'migrationPlanId' = 'null'::jsonb
      then null else (p_request->>'migrationPlanId')::uuid end,
    (p_request->>'dryRunId')::uuid
  );
  update platform_private.cms_content_type_versions
  set state = 'active', version = version + 1, updated_at = now(), approved_at = coalesce(approved_at, now()),
      dry_run_id = (p_request->>'dryRunId')::uuid,
      activation_workflow_policy_key = 'cms.schema.activate',
      activation_workflow_policy_version = 1,
      activation_workflow_policy_hash = policy_hash,
      activation_required_decision_count = approval_count,
      activation_required_capabilities = jsonb_build_array('cms.schema_designer'),
      -- Store the same outer policy/evidence envelope that the worker
      -- validator recomputes, not the inner approval-set digest.
      activation_approval_evidence_hash = activation_evidence_hash
  where id = candidate.id and version = expected_version;
  if not found then raise exception 'CONFLICT' using errcode = 'P0001'; end if;
  if current_active.id is not null then
    update platform_private.cms_content_type_versions set state = 'superseded', updated_at = now(), version = version + 1 where id = current_active.id;
  end if;
  update platform_private.cms_content_types set state = 'active', version = version + 1, updated_at = now() where id = candidate.content_type_id;
  event_id := platform_private.cms_emit_event(
    'cms.schema.activate', actor_id, acting_party_id, 'cms_content_type_version', candidate.id,
    'CMS_SCHEMA_ACTIVATED', 'cms.schema.activated.v1', 'cms_content_type_version', candidate.id,
    expected_version + 1,
    jsonb_build_object(
      'contentTypeId', candidate.content_type_id,
      'schemaVersionId', candidate.id,
      'migrationPlanId', migration_plan_id,
      'activationEvidence', jsonb_build_object(
        'key', 'cms.schema.activate', 'version', '1', 'policyHash', policy_hash,
        'riskClass', risk_class,
        'requiredDecisionCount', approval_count,
        'requiredCapabilities', jsonb_build_array('cms.schema_designer'),
        'approvalEvidenceHash', activation_evidence_hash
      )
    ), correlation_id
  );
  response := jsonb_build_object(
    'id', candidate.id, 'version', (expected_version + 1)::text, 'contentTypeVersionId', candidate.id,
    'state', 'active', 'activatedAt', now(), 'migrationPlanId', migration_plan_id,
    'activationEvidence', jsonb_build_object(
      'key', 'cms.schema.activate', 'version', '1', 'policyHash', policy_hash,
      'riskClass', risk_class, 'requiredDecisionCount', approval_count,
      'requiredCapabilities', jsonb_build_array('cms.schema_designer'),
      'approvalEvidenceHash', activation_evidence_hash
    ), 'jobId', null, 'eventType', 'cms.schema.activated.v1', 'eventId', event_id
  );
  perform platform_private.cms_complete(reservation.id, candidate.id, 202, response);
  return response;
end;
$body$;

drop function if exists platform_private.cms_release_nonce_claim(jsonb, text, uuid);

create or replace function platform_private.cms_release_nonce_claim_at(
  p_request jsonb,
  p_operation_id text,
  p_actor_id uuid,
  p_now_at timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  release_key_value text := p_request->>'releaseKeyId';
  nonce text := p_request->>'releaseNonce';
  issued text := p_request->>'releaseIssuedAt';
  raw_hash text := p_request->>'releaseRawBodyHash';
  supplied_signature_hash text := p_request->>'releaseSignatureHash';
  signature_value text := p_request->>'releaseSignature';
  verified text := p_request->>'releaseVerifiedAt';
  issued_at timestamptz;
  verified_at timestamptz;
  now_at timestamptz := coalesce(p_now_at, pg_catalog.clock_timestamp());
  receipt_id uuid;
  signature_bytes bytea;
  computed_signature_hash text;
  public_key_value bytea;
begin
  if release_key_value is null or release_key_value !~ '^[a-z][a-z0-9_.-]{1,95}$'
     or not platform_private.cms_valid_uuid(nonce)
     or issued is null or raw_hash is null or raw_hash !~ '^[a-f0-9]{64}$'
     or supplied_signature_hash is null or supplied_signature_hash !~ '^[a-f0-9]{64}$'
     or not platform_private.cms_valid_base64(signature_value)
     or verified is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  begin
    issued_at := issued::timestamptz;
    verified_at := verified::timestamptz;
  exception when others then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  if issued_at > now_at + interval '5 minutes'
     or issued_at < now_at - interval '5 minutes'
     or verified_at > now_at + interval '5 minutes'
     or verified_at < now_at - interval '5 minutes' then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  begin
    signature_bytes := pg_catalog.decode(signature_value, 'base64');
  exception when others then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end;
  if pg_catalog.octet_length(signature_bytes) <> 64 then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  computed_signature_hash := pg_catalog.encode(
    extensions.digest(signature_bytes, 'sha256'), 'hex'
  );
  if supplied_signature_hash <> computed_signature_hash then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  -- Lock the exact current trust row before verifying either release or
  -- props evidence.  A rotation/revocation update must wait for this
  -- transaction, so both signatures observe one key state.
  select principal.public_key into public_key_value
  from platform_private.cfg_release_principals principal
  where principal.principal_id = p_actor_id
    and principal.key_id = release_key_value
    and principal.active
    and principal.revoked_at is null
    and (principal.valid_from is null or principal.valid_from <= issued_at)
    and (principal.valid_through is null or principal.valid_through >= issued_at)
    and (principal.valid_from is null or principal.valid_from <= now_at)
    and (principal.valid_through is null or principal.valid_through >= now_at)
    and principal.public_key is not null
    and pg_catalog.octet_length(principal.public_key) = 32
  for update;
  if public_key_value is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  if not pgsodium.crypto_sign_verify_detached(
    signature_bytes,
    pg_catalog.convert_to(
      platform_private.cms_release_signing_payload(p_request, p_operation_id), 'utf8'
    ),
    public_key_value
  ) then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  insert into platform_private.cms_release_nonce_receipts(
    release_key_id, nonce_hash, operation_id, issued_at, expires_at,
    raw_body_hash, signature_hash, verified_at, outcome
  ) values (
    release_key_value, encode(extensions.digest(convert_to(nonce, 'utf8'), 'sha256'), 'hex'), p_operation_id,
    issued_at, issued_at + interval '10 minutes', raw_hash,
    computed_signature_hash, now_at, 'claimed'
  ) on conflict (release_key_id, nonce_hash) do nothing
  returning id into receipt_id;
  if receipt_id is null then raise exception 'CONFLICT' using errcode = 'P0001'; end if;
  return receipt_id;
exception when invalid_text_representation or datetime_field_overflow then
  raise exception 'INVALID_REQUEST' using errcode = 'P0001';
end;
$body$;

create or replace function platform_private.cms_release_nonce_claim(
  p_request jsonb,
  p_operation_id text,
  p_actor_id uuid
)
returns uuid
language sql
security definer
set search_path = ''
as $body$
  select platform_private.cms_release_nonce_claim_at(
    p_request, p_operation_id, p_actor_id, pg_catalog.clock_timestamp()
  )
$body$;

create or replace function platform_private.cms_verify_props_attestation(
  p_request jsonb,
  p_actor_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  attestation jsonb := p_request->'propsSnapshotAttestation';
  attestation_key_id text := attestation->>'keyId';
  release_key_id text := p_request->>'releaseKeyId';
  signature_value text := attestation->>'signature';
  signature_bytes bytea;
  public_key_value bytea;
  signature_hash text;
  verified_at timestamptz := pg_catalog.clock_timestamp();
begin
  if attestation_key_id is null or attestation_key_id is distinct from release_key_id
     or not platform_private.cms_valid_base64(signature_value)
     or platform_private.cms_jcs_sha256(p_request->'propsSchemaSnapshot')
          is distinct from p_request->>'propsSnapshotHash' then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  begin
    signature_bytes := pg_catalog.decode(signature_value, 'base64');
  exception when others then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end;
  if pg_catalog.octet_length(signature_bytes) <> 64 then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  select principal.public_key into public_key_value
  from platform_private.cfg_release_principals principal
  where principal.principal_id = p_actor_id
    and principal.key_id = attestation_key_id
    and principal.active
    and principal.revoked_at is null
    and (principal.valid_from is null or principal.valid_from <= verified_at)
    and (principal.valid_through is null or principal.valid_through >= verified_at)
    and principal.public_key is not null
    and pg_catalog.octet_length(principal.public_key) = 32;
  if public_key_value is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  if not pgsodium.crypto_sign_verify_detached(
    signature_bytes,
    pg_catalog.convert_to(platform_private.cms_props_attestation_payload(p_request), 'utf8'),
    public_key_value
  ) then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  signature_hash := pg_catalog.encode(extensions.digest(signature_bytes, 'sha256'), 'hex');
  return jsonb_build_object(
    'keyId', attestation_key_id, 'signatureHash', signature_hash, 'verifiedAt', verified_at
  );
end;
$body$;

create or replace function platform_private.cms_require_release_worker()
returns void
language plpgsql
security definer
set search_path = ''
as $body$
begin
  if pg_catalog.current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
end;
$body$;

-- PostgREST carries the Worker-authenticated release principal in the
-- request context.  The RPC remains service-role-only, and the context key
-- must match the signed envelope key before the protected trust row is used.
create or replace function platform_private.cms_release_actor(p_request jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $body$
declare
  bound_key text := nullif(platform_private.cfg_context_value(p_request, 'releasePrincipalId'), '');
  requested_key text := nullif(p_request->>'releaseKeyId', '');
  now_at timestamptz := pg_catalog.clock_timestamp();
  actor_id uuid;
begin
  if pg_catalog.current_setting('request.jwt.claim.role', true) is distinct from 'service_role'
     or bound_key is null or bound_key !~ '^[a-z][a-z0-9_.-]{1,95}$'
     or requested_key is distinct from bound_key then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  select principal.principal_id
    into actor_id
    from platform_private.cfg_release_principals principal
   where principal.key_id = bound_key
     and principal.active
     and principal.revoked_at is null
     and (principal.valid_from is null or principal.valid_from <= now_at)
     and (principal.valid_through is null or principal.valid_through >= now_at);
  if actor_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  return actor_id;
end;
$body$;

drop function if exists platform_private.cms_register_block(jsonb);

create or replace function platform_private.cms_register_block_at(
  p_request jsonb,
  p_now_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor_id uuid;
  reservation platform_private.idempotency_records;
  correlation_id uuid;
  receipt_id uuid;
  release_receipt platform_private.cms_release_nonce_receipts%rowtype;
  block_id uuid := extensions.gen_random_uuid();
  attestation_evidence jsonb;
  response jsonb;
  now_at timestamptz := coalesce(p_now_at, pg_catalog.clock_timestamp());
begin
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  perform platform_private.cms_require_release_worker();
  actor_id := platform_private.cms_release_actor(p_request);
  correlation_id := platform_private.cms_correlation(p_request);
  reservation := platform_private.cms_reserve(p_request, actor_id, 'CMS-03A-05:' || coalesce(p_request->>'blockKey', ''));
  if reservation.state = 'completed'::platform_private.idempotency_state then
    if reservation.response_ref->'safeHeaders' ? 'response' then
      return reservation.response_ref->'safeHeaders'->'response';
    end if;
    return jsonb_build_object('resourceKind', 'block_definition_version', 'id', (reservation.response_ref->>'resourceRef')::uuid);
  end if;
  if not platform_private.cms_valid_block_request(p_request) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  -- Claim and lock the release-principal row before reading the nested
  -- attestation.  The key rotation cannot split the two verifications.
  receipt_id := platform_private.cms_release_nonce_claim_at(
    p_request, 'CMS-03A-05', actor_id, now_at
  );
  attestation_evidence := platform_private.cms_verify_props_attestation(p_request, actor_id);
  select * into release_receipt
  from platform_private.cms_release_nonce_receipts
  where id = receipt_id;
  insert into platform_private.cms_block_definition_versions(
    id, owner_id, state, version, block_key, block_version, props_schema_ref,
    props_schema_hash, props_schema_snapshot, props_snapshot_hash,
    props_snapshot_attestation, props_attestation_key_id,
    props_attestation_signature_hash, props_attestation_verified_at, renderer_ref,
    allowed_children, slot_rules, data_source_permissions, accessibility_contract,
    compatibility_range, release_digest, release_principal_id, release_key_id,
    release_raw_body_hash, release_signature_hash, release_nonce_hash,
    release_verified_at
  ) values (
    block_id, actor_id, 'registered', 1, p_request->>'blockKey',
    (p_request->>'blockVersion')::integer, p_request->>'propsSchemaRef',
    p_request->>'propsSchemaHash', p_request->'propsSchemaSnapshot',
    p_request->>'propsSnapshotHash', p_request->'propsSnapshotAttestation',
    attestation_evidence->>'keyId', attestation_evidence->>'signatureHash',
    release_receipt.verified_at,
    p_request->>'rendererRef', coalesce(p_request->'allowedChildren', '[]'::jsonb),
    coalesce(p_request->'slotRules', '{}'::jsonb), coalesce(p_request->'dataSourcePermissions', '[]'::jsonb),
    coalesce(p_request->'accessibility', p_request->'accessibilityContract'),
    coalesce(p_request->'compatibility', p_request->'compatibilityRange'), p_request->>'releaseDigest',
    actor_id, release_receipt.release_key_id,
    release_receipt.raw_body_hash,
    release_receipt.signature_hash,
    encode(extensions.digest(convert_to(p_request->>'releaseNonce', 'utf8'), 'sha256'), 'hex'),
    release_receipt.verified_at
  );
  perform platform_private.cms_emit_event(
    'cms.block.register', actor_id, actor_id, 'cms_block_definition_version', block_id,
    'CMS_BLOCK_REGISTERED', 'cms.block.registered.v1', 'cms_block_definition_version', block_id,
    1,
    jsonb_build_object(
      'blockDefinitionVersionId', block_id,
      'blockKey', p_request->>'blockKey',
      'blockVersion', (p_request->>'blockVersion')::integer,
      'releaseDigest', p_request->>'releaseDigest'
    ), correlation_id
  );
  update platform_private.cms_release_nonce_receipts set outcome = 'consumed', consumed_at = now(), updated_at = now() where id = receipt_id;
  select jsonb_build_object(
    'resourceKind', 'block_definition_version', 'id', block.id, 'version', block.version::text,
    'blockKey', block.block_key, 'blockVersion', block.block_version,
    'propsSchemaRef', block.props_schema_ref, 'propsSchemaHash', block.props_schema_hash,
    'propsSchemaSnapshot', block.props_schema_snapshot, 'propsSnapshotHash', block.props_snapshot_hash,
    'propsSnapshotAttestation', block.props_snapshot_attestation, 'rendererRef', block.renderer_ref,
    'releaseDigest', block.release_digest, 'releaseKeyId', block.release_key_id,
    'releaseRawBodyHash', block.release_raw_body_hash, 'releaseSignatureHash', block.release_signature_hash,
    'releaseNonceHash', block.release_nonce_hash, 'releaseVerifiedAt', block.release_verified_at,
    'lifecycle', 'supported'
  ) into response from platform_private.cms_block_definition_versions block where block.id = block_id;
  perform platform_private.cms_complete(reservation.id, block_id, 201, response);
  return response;
end;
$body$;

create or replace function platform_private.cms_register_block(p_request jsonb)
returns jsonb
language sql
security definer
set search_path = ''
as $body$
  -- idempotency reservation and completion remain inside the shared body.
  select platform_private.cms_register_block_at(
    p_request, pg_catalog.clock_timestamp()
  )
$body$;

create or replace function platform_private.cms_advance_block_lifecycle(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor_id uuid;
  reservation platform_private.idempotency_records;
  correlation_id uuid;
  receipt_id uuid;
  release_receipt platform_private.cms_release_nonce_receipts%rowtype;
  block_row platform_private.cms_block_definition_versions%rowtype;
  current_lifecycle text := 'supported';
  event_id uuid;
  response jsonb;
begin
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  perform platform_private.cms_require_release_worker();
  actor_id := platform_private.cms_release_actor(p_request);
  correlation_id := platform_private.cms_correlation(p_request);
  reservation := platform_private.cms_reserve(p_request, actor_id, 'CMS-03A-08:' || coalesce(p_request->>'blockDefinitionVersionId', ''));
  if reservation.state = 'completed'::platform_private.idempotency_state then
    if reservation.response_ref->'safeHeaders' ? 'response' then
      return reservation.response_ref->'safeHeaders'->'response';
    end if;
    return jsonb_build_object('resourceKind', 'block_definition_lifecycle_event', 'id', (reservation.response_ref->>'resourceRef')::uuid);
  end if;
  if not platform_private.cms_valid_uuid(p_request->>'blockDefinitionVersionId')
     or p_request->>'fromLifecycle' not in ('supported', 'deprecated')
     or p_request->>'toLifecycle' not in ('deprecated', 'withdrawn')
     or not platform_private.cms_valid_version(p_request->>'expectedVersion')
     or p_request->>'releaseDigest' !~ '^[a-f0-9]{64}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  receipt_id := platform_private.cms_release_nonce_claim(p_request, 'CMS-03A-08', actor_id);
  select * into release_receipt
  from platform_private.cms_release_nonce_receipts
  where id = receipt_id;
  select * into block_row from platform_private.cms_block_definition_versions
  where id = (p_request->>'blockDefinitionVersionId')::uuid
    and owner_id = actor_id
  for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  select to_lifecycle into current_lifecycle
  from platform_private.cms_block_definition_lifecycle_events
  where block_definition_version_id = block_row.id
  order by created_at desc, id desc limit 1;
  current_lifecycle := coalesce(current_lifecycle, 'supported');
  if current_lifecycle <> p_request->>'fromLifecycle'
     or block_row.version <> (p_request->>'expectedVersion')::bigint
     or block_row.release_digest <> p_request->>'releaseDigest' then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  insert into platform_private.cms_block_definition_lifecycle_events(
    owner_id, state, version, block_definition_version_id, block_key, block_version,
    from_lifecycle, to_lifecycle, release_digest, release_principal_id, release_key_id,
    release_raw_body_hash, release_signature_hash, release_nonce_hash, release_verified_at
  ) values (
    actor_id, 'recorded', 1, block_row.id, block_row.block_key, block_row.block_version,
    p_request->>'fromLifecycle', p_request->>'toLifecycle', block_row.release_digest, actor_id,
    release_receipt.release_key_id, release_receipt.raw_body_hash,
    release_receipt.signature_hash, release_receipt.nonce_hash, release_receipt.verified_at
  ) returning id into event_id;
  perform platform_private.cms_emit_event(
    'cms.block.lifecycle.advance', actor_id, actor_id, 'cms_block_definition_lifecycle_event', event_id,
    'CMS_BLOCK_LIFECYCLE_CHANGED', 'cms.block.lifecycle.changed.v1', 'cms_block_definition_version',
    block_row.id, block_row.version,
    jsonb_build_object(
      'blockDefinitionVersionId', block_row.id, 'blockKey', block_row.block_key,
      'blockVersion', block_row.block_version, 'fromLifecycle', p_request->>'fromLifecycle',
      'toLifecycle', p_request->>'toLifecycle', 'releaseDigest', block_row.release_digest,
      'releaseKeyId', release_receipt.release_key_id,
      'releaseRawBodyHash', release_receipt.raw_body_hash,
      'releaseSignatureHash', release_receipt.signature_hash,
      'releaseNonceHash', release_receipt.nonce_hash,
      'releaseVerifiedAt', release_receipt.verified_at
    ), correlation_id
  );
  update platform_private.cms_release_nonce_receipts set outcome = 'consumed', consumed_at = now(), updated_at = now() where id = receipt_id;
  select jsonb_build_object(
    'resourceKind', 'block_definition_lifecycle_event', 'id', event.id, 'version', event.version::text,
    'blockDefinitionVersionId', event.block_definition_version_id, 'blockKey', event.block_key,
    'blockVersion', event.block_version, 'fromLifecycle', event.from_lifecycle,
    'toLifecycle', event.to_lifecycle, 'lifecycle', event.to_lifecycle,
    'releaseDigest', event.release_digest, 'releaseKeyId', event.release_key_id,
    'releaseNonceHash', event.release_nonce_hash, 'releaseVerifiedAt', event.release_verified_at,
    'eventType', 'cms.block.lifecycle.changed.v1', 'createdAt', event.created_at
  ) into response from platform_private.cms_block_definition_lifecycle_events event where event.id = event_id;
  perform platform_private.cms_complete(reservation.id, event_id, 201, response);
  return response;
end;
$body$;

create or replace function platform_private.cms_list_content_types(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor_id uuid;
  scope_id uuid;
  resource_kind text := nullif(p_request->>'resourceKind', '');
  key_prefix text := nullif(p_request->>'keyPrefix', '');
  lifecycle_filter text := nullif(p_request->>'lifecycle', '');
  state_filter text := nullif(p_request->>'state', '');
  sort_value text := coalesce(nullif(p_request->>'sort', ''), 'key');
  direction_value text := coalesce(nullif(p_request->>'direction', ''), 'asc');
  cursor_text text := nullif(p_request->>'cursor', '');
  cursor_value jsonb;
  query_hash text;
  cursor_hash text;
  cursor_id uuid;
  cursor_key text;
  cursor_created_at timestamptz;
  cursor_updated_at timestamptz;
  cursor_version bigint;
  item jsonb;
  items jsonb := '[]'::jsonb;
  limit_value integer;
  returned_count integer := 0;
  has_more boolean := false;
  next_cursor text;
  last_id uuid;
  last_key text;
  last_created_at timestamptz;
  last_updated_at timestamptz;
  last_version bigint;
  row_record record;
begin
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  if not platform_private.cms_exact_keys(
    p_request,
    array[]::text[],
    array[
      'resourceKind','keyPrefix','lifecycle','state','limit','cursor','sort',
      'direction'
    ]::text[]
  ) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  begin
    limit_value := coalesce(nullif(p_request->>'limit', '')::integer, 25);
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  actor_id := platform_private.cms_actor(p_request);
  scope_id := platform_private.cms_acting_party(p_request, actor_id);
  if limit_value not between 1 and 100
     or (resource_kind is not null and resource_kind not in (
       'content_type','content_type_version','field_definition_version',
       'relation_definition','schema_artifact','block_definition_registry_record',
       'template_binding','capability_binding'
     ))
     or (key_prefix is not null and key_prefix !~ '^[a-z][a-z0-9._-]{0,63}$')
     or (lifecycle_filter is not null and lifecycle_filter not in (
       'active','retired','deprecated','supported','withdrawn'
     ))
     or (state_filter is not null and state_filter not in (
       'draft','review','approved','scheduled','active','superseded','retired',
       'blocked','compiled'
     ))
     or sort_value not in ('key','createdAt','updatedAt','version')
     or direction_value not in ('asc','desc')
     or (cursor_text is not null and pg_catalog.octet_length(cursor_text) not between 1 and 512)
     or (lifecycle_filter is not null and state_filter is not null) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if resource_kind in (
       'content_type_version','relation_definition','schema_artifact',
       'template_binding','capability_binding'
     ) and lifecycle_filter is not null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if resource_kind in ('content_type','field_definition_version','block_definition_registry_record')
     and state_filter is not null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  perform platform_private.cms_require_read(actor_id, scope_id);
  query_hash := platform_private.cms_jcs_sha256(jsonb_build_object(
    'actorId', actor_id, 'scopeId', scope_id, 'resourceKind', resource_kind,
    'keyPrefix', key_prefix, 'lifecycle', lifecycle_filter, 'state', state_filter,
    'limit', limit_value, 'sort', sort_value, 'direction', direction_value
  ));
  if cursor_text is not null then
    begin
      cursor_value := pg_catalog.convert_from(
        pg_catalog.decode(cursor_text, 'base64'), 'utf8'
      )::jsonb;
    exception when others then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end;
    if not platform_private.cms_exact_keys(
      cursor_value,
      array['queryHash','lastId','lastKey','lastCreatedAt','lastUpdatedAt','lastVersion']::text[],
      array['queryHash','lastId','lastKey','lastCreatedAt','lastUpdatedAt','lastVersion']::text[]
    ) then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    cursor_hash := cursor_value->>'queryHash';
    if not platform_private.cms_valid_hash(cursor_hash)
       or cursor_hash is distinct from query_hash
       or not platform_private.cms_valid_uuid(cursor_value->>'lastId') then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    cursor_id := (cursor_value->>'lastId')::uuid;
    cursor_key := cursor_value->>'lastKey';
    begin
      cursor_created_at := (cursor_value->>'lastCreatedAt')::timestamptz;
      cursor_updated_at := (cursor_value->>'lastUpdatedAt')::timestamptz;
      cursor_version := (cursor_value->>'lastVersion')::bigint;
    exception when others then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end;
  end if;
  for row_record in
    select registry_row.*
    from (
      select 'content_type'::text as kind, type_row.id,
        type_row.type_key as sort_key, type_row.created_at, type_row.updated_at,
        type_row.version as sort_version, type_row.state as lifecycle_value,
        null::text as state_value,
        jsonb_build_object(
          'resourceKind', 'content_type', 'id', type_row.id,
          'version', type_row.version::text, 'typeKey', type_row.type_key,
          'builtIn', type_row.built_in, 'lifecycle', type_row.state,
          'createdAt', type_row.created_at, 'updatedAt', type_row.updated_at
        ) as item
      from platform_private.cms_content_types type_row
      where type_row.owner_id = scope_id
      union all
      select 'content_type_version', version_row.id, type_row.type_key,
        version_row.created_at, version_row.updated_at, version_row.version,
        null, version_row.state::text, platform_private.cms_type_version_resource(version_row.id)
      from platform_private.cms_content_type_versions version_row
      join platform_private.cms_content_types type_row
        on type_row.id = version_row.content_type_id
      where version_row.owner_id = scope_id
      union all
      select 'field_definition_version', field_row.id, field_row.field_key,
        field_row.created_at, field_row.updated_at, field_row.version,
        field_row.state, null,
        jsonb_build_object(
          'resourceKind', 'field_definition_version', 'id', field_row.id,
          'version', field_row.version::text,
          'contentHash', encode(extensions.digest(convert_to(field_row::text, 'utf8'), 'sha256'), 'hex'),
          'createdAt', field_row.created_at, 'updatedAt', field_row.updated_at,
          'contentTypeVersionId', field_row.content_type_version_id,
          'stableFieldId', field_row.stable_field_id, 'key', field_row.field_key,
          'kind', field_row.kind, 'required', field_row.required,
          'validatorKey', field_row.validator_key,
          'validatorVersion', field_row.validator_version::text,
          'defaultMode', field_row.default_mode,
          'localizationMode', field_row.localization_mode,
          'lifecycle', field_row.state, 'migrationPlanId', null
        )
      from platform_private.cms_field_definition_versions field_row
      where field_row.owner_id = scope_id
      union all
      select 'relation_definition', relation_row.id, relation_row.projection_key,
        relation_row.created_at, relation_row.updated_at, relation_row.version,
        null, relation_row.state::text,
        jsonb_build_object(
          'resourceKind', 'relation_definition', 'id', relation_row.id,
          'version', relation_row.version::text,
          'contentHash', encode(extensions.digest(convert_to(relation_row::text, 'utf8'), 'sha256'), 'hex'),
          'createdAt', relation_row.created_at, 'updatedAt', relation_row.updated_at,
          'state', relation_row.state::text,
          'contentTypeVersionId', field_row.content_type_version_id,
          'fieldId', relation_row.field_definition_id, 'targetKind', relation_row.target_kind,
          'targetType', relation_row.target_type, 'projectionKey', relation_row.projection_key,
          'cardinality', relation_row.cardinality, 'min', relation_row.min_count,
          'max', relation_row.max_count, 'ordered', relation_row.ordered,
          'onUnavailable', relation_row.on_unavailable
        )
      from platform_private.cms_relation_definitions relation_row
      join platform_private.cms_field_definition_versions field_row
        on field_row.id = relation_row.field_definition_id
      where relation_row.owner_id = scope_id
      union all
      select 'schema_artifact', artifact.id, artifact.zod_contract_ref,
        artifact.created_at, artifact.updated_at, artifact.version,
        null, artifact.state,
        jsonb_build_object(
          'resourceKind', 'schema_artifact', 'id', artifact.id,
          'version', artifact.version::text, 'state', artifact.state,
          'contentTypeVersionId', artifact.content_type_version_id,
          'compilerVersion', artifact.compiler_version,
          'zodContractRef', artifact.zod_contract_ref,
          'artifactHash', artifact.artifact_hash, 'createdAt', artifact.created_at,
          'updatedAt', artifact.updated_at, 'compiledAt', artifact.compiled_at
        )
      from platform_private.cms_schema_artifacts artifact
      where artifact.owner_id = scope_id
      union all
      select 'block_definition_registry_record', block_row.id, block_row.block_key,
        block_row.created_at, block_row.updated_at, block_row.block_version::bigint,
        coalesce(lifecycle_row.to_lifecycle, 'supported'), null,
        jsonb_build_object(
          'resourceKind', 'block_definition_registry_record', 'id', block_row.id,
          'version', block_row.version::text, 'blockKey', block_row.block_key,
          'blockVersion', block_row.block_version, 'propsSchemaRef', block_row.props_schema_ref,
          'propsSchemaHash', block_row.props_schema_hash, 'rendererRef', block_row.renderer_ref,
          'releaseDigest', block_row.release_digest,
          'lifecycle', coalesce(lifecycle_row.to_lifecycle, 'supported')
        )
      from platform_private.cms_block_definition_versions block_row
      left join lateral (
        select event_row.to_lifecycle
        from platform_private.cms_block_definition_lifecycle_events event_row
        where event_row.block_definition_version_id = block_row.id
        order by event_row.created_at desc, event_row.id desc
        limit 1
      ) lifecycle_row on true
      where block_row.owner_id = scope_id
      union all
      select 'template_binding', template_row.id, template_row.template_version_id::text,
        template_row.created_at, template_row.updated_at, template_row.version,
        null, template_row.state::text,
        jsonb_build_object(
          'resourceKind', 'template_binding', 'id', template_row.id,
          'contentTypeVersionId', template_row.content_type_version_id,
          'templateVersionId', template_row.template_version_id,
          'position', template_row.position, 'version', template_row.version::text,
          'state', template_row.state::text
        )
      from platform_private.cms_content_type_template_bindings template_row
      where template_row.owner_id = scope_id
      union all
      select 'capability_binding', capability_row.id, capability_row.capability_key,
        capability_row.created_at, capability_row.updated_at, capability_row.version,
        null, capability_row.state::text,
        jsonb_build_object(
          'resourceKind', 'capability_binding', 'id', capability_row.id,
          'contentTypeVersionId', capability_row.content_type_version_id,
          'capabilityKey', capability_row.capability_key,
          'capabilityVersion', capability_row.capability_version::text,
          'version', capability_row.version::text, 'state', capability_row.state::text
        )
      from platform_private.cms_content_type_capability_bindings capability_row
      where capability_row.owner_id = scope_id
    ) registry_row
    where (resource_kind is null or registry_row.kind = resource_kind)
      and (key_prefix is null or registry_row.sort_key like key_prefix || '%')
      and (
        (lifecycle_filter is null and state_filter is null)
        or (lifecycle_filter is not null and registry_row.lifecycle_value = lifecycle_filter)
        or (state_filter is not null and registry_row.state_value = state_filter)
      )
    order by
      case when sort_value = 'key' and direction_value = 'asc' then registry_row.sort_key end asc,
      case when sort_value = 'key' and direction_value = 'desc' then registry_row.sort_key end desc,
      case when sort_value = 'createdAt' and direction_value = 'asc' then registry_row.created_at end asc,
      case when sort_value = 'createdAt' and direction_value = 'desc' then registry_row.created_at end desc,
      case when sort_value = 'updatedAt' and direction_value = 'asc' then registry_row.updated_at end asc,
      case when sort_value = 'updatedAt' and direction_value = 'desc' then registry_row.updated_at end desc,
      case when sort_value = 'version' and direction_value = 'asc' then registry_row.sort_version end asc,
      case when sort_value = 'version' and direction_value = 'desc' then registry_row.sort_version end desc,
      case when direction_value = 'asc' then registry_row.id end asc,
      case when direction_value = 'desc' then registry_row.id end desc
  loop
    if cursor_value is not null then
      if sort_value = 'key' and direction_value = 'asc'
         and not (row_record.sort_key > cursor_key
           or (row_record.sort_key = cursor_key and row_record.id > cursor_id)) then continue; end if;
      if sort_value = 'key' and direction_value = 'desc'
         and not (row_record.sort_key < cursor_key
           or (row_record.sort_key = cursor_key and row_record.id < cursor_id)) then continue; end if;
      if sort_value = 'createdAt' and direction_value = 'asc'
         and not (row_record.created_at > cursor_created_at
           or (row_record.created_at = cursor_created_at and row_record.id > cursor_id)) then continue; end if;
      if sort_value = 'createdAt' and direction_value = 'desc'
         and not (row_record.created_at < cursor_created_at
           or (row_record.created_at = cursor_created_at and row_record.id < cursor_id)) then continue; end if;
      if sort_value = 'updatedAt' and direction_value = 'asc'
         and not (row_record.updated_at > cursor_updated_at
           or (row_record.updated_at = cursor_updated_at and row_record.id > cursor_id)) then continue; end if;
      if sort_value = 'updatedAt' and direction_value = 'desc'
         and not (row_record.updated_at < cursor_updated_at
           or (row_record.updated_at = cursor_updated_at and row_record.id < cursor_id)) then continue; end if;
      if sort_value = 'version' and direction_value = 'asc'
         and not (row_record.sort_version > cursor_version
           or (row_record.sort_version = cursor_version and row_record.id > cursor_id)) then continue; end if;
      if sort_value = 'version' and direction_value = 'desc'
         and not (row_record.sort_version < cursor_version
           or (row_record.sort_version = cursor_version and row_record.id < cursor_id)) then continue; end if;
    end if;
    if returned_count >= limit_value then
      has_more := true;
      exit;
    end if;
    item := row_record.item;
    items := items || jsonb_build_array(item);
    returned_count := returned_count + 1;
    last_id := row_record.id;
    last_key := row_record.sort_key;
    last_created_at := row_record.created_at;
    last_updated_at := row_record.updated_at;
    last_version := row_record.sort_version;
  end loop;
  if has_more then
    next_cursor := replace(pg_catalog.encode(
      pg_catalog.convert_to(platform_private.cms_jcs(jsonb_build_object(
        'queryHash', query_hash, 'lastId', last_id, 'lastKey', last_key,
        'lastCreatedAt', last_created_at, 'lastUpdatedAt', last_updated_at,
        'lastVersion', last_version
      )), 'utf8'),
      'base64'
    ), E'\n', '');
  end if;
  return jsonb_build_object('items', items, 'nextCursor', next_cursor);
exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception 'INVALID_REQUEST' using errcode = 'P0001';
end;
$body$;

create or replace function platform_private.cms_get_content_type_version(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  actor_id uuid;
  acting_party_id uuid;
  version_row platform_private.cms_content_type_versions%rowtype;
  response jsonb;
  fields jsonb := '[]'::jsonb;
  relations jsonb := '[]'::jsonb;
  templates jsonb := '[]'::jsonb;
  capabilities jsonb := '[]'::jsonb;
  blocks jsonb := '[]'::jsonb;
  item jsonb;
  row_record record;
begin
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
  actor_id := platform_private.cms_actor(p_request);
  acting_party_id := platform_private.cms_acting_party(p_request, actor_id);
  perform platform_private.cms_require_read(actor_id, acting_party_id);
  if not platform_private.cms_valid_uuid(p_request->>'contentTypeId')
     or not platform_private.cms_valid_uuid(p_request->>'versionId') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into version_row from platform_private.cms_content_type_versions version_candidate
  where version_candidate.id = (p_request->>'versionId')::uuid
    and version_candidate.content_type_id = (p_request->>'contentTypeId')::uuid
    and version_candidate.owner_id = acting_party_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  for row_record in select * from platform_private.cms_field_definition_versions where content_type_version_id = version_row.id order by field_key loop
    item := jsonb_build_object('resourceKind', 'field_definition_version', 'id', row_record.id, 'version', row_record.version::text, 'contentHash', encode(extensions.digest(convert_to(row_record::text, 'utf8'), 'sha256'), 'hex'), 'createdAt', row_record.created_at, 'updatedAt', row_record.updated_at, 'contentTypeVersionId', row_record.content_type_version_id, 'stableFieldId', row_record.stable_field_id, 'key', row_record.field_key, 'kind', row_record.kind, 'required', row_record.required, 'validatorKey', row_record.validator_key, 'validatorVersion', row_record.validator_version::text, 'defaultMode', row_record.default_mode, 'localizationMode', row_record.localization_mode, 'lifecycle', row_record.state, 'migrationPlanId', null);
    fields := fields || jsonb_build_array(item);
  end loop;
  for row_record in select relation.* from platform_private.cms_relation_definitions relation join platform_private.cms_field_definition_versions field on field.id = relation.field_definition_id where field.content_type_version_id = version_row.id order by relation.id loop
    item := jsonb_build_object('resourceKind', 'relation_definition', 'id', row_record.id, 'version', row_record.version::text, 'contentHash', encode(extensions.digest(convert_to(row_record::text, 'utf8'), 'sha256'), 'hex'), 'createdAt', row_record.created_at, 'updatedAt', row_record.updated_at, 'contentTypeVersionId', version_row.id, 'fieldId', row_record.field_definition_id, 'targetKind', row_record.target_kind, 'targetType', row_record.target_type, 'projectionKey', row_record.projection_key, 'cardinality', row_record.cardinality, 'min', row_record.min_count, 'max', row_record.max_count, 'ordered', row_record.ordered, 'onUnavailable', row_record.on_unavailable);
    relations := relations || jsonb_build_array(item);
  end loop;
  for row_record in select * from platform_private.cms_content_type_template_bindings where content_type_version_id = version_row.id order by position, id loop
    templates := templates || jsonb_build_array(jsonb_build_object('resourceKind', 'template_binding', 'id', row_record.id, 'contentTypeVersionId', row_record.content_type_version_id, 'templateVersionId', row_record.template_version_id, 'position', row_record.position, 'version', row_record.version::text, 'state', row_record.state::text));
  end loop;
  for row_record in select * from platform_private.cms_content_type_capability_bindings where content_type_version_id = version_row.id order by capability_key loop
    capabilities := capabilities || jsonb_build_array(jsonb_build_object('resourceKind', 'capability_binding', 'id', row_record.id, 'contentTypeVersionId', row_record.content_type_version_id, 'capabilityKey', row_record.capability_key, 'capabilityVersion', row_record.capability_version::text, 'version', row_record.version::text, 'state', row_record.state::text));
  end loop;
  for row_record in
    select block_row.*, coalesce(lifecycle_row.to_lifecycle, 'supported') as lifecycle_value
    from platform_private.cms_block_definition_versions block_row
    left join lateral (
      select event_row.to_lifecycle
      from platform_private.cms_block_definition_lifecycle_events event_row
      where event_row.block_definition_version_id = block_row.id
      order by event_row.created_at desc, event_row.id desc
      limit 1
    ) lifecycle_row on true
    where block_row.state = 'registered'
      and block_row.owner_id = acting_party_id
    order by block_row.block_key, block_row.block_version
  loop
    blocks := blocks || jsonb_build_array(jsonb_build_object(
      'resourceKind', 'block_definition_registry_record', 'id', row_record.id,
      'version', row_record.version::text, 'blockKey', row_record.block_key,
      'blockVersion', row_record.block_version, 'propsSchemaRef', row_record.props_schema_ref,
      'propsSchemaHash', row_record.props_schema_hash, 'rendererRef', row_record.renderer_ref,
      'releaseDigest', row_record.release_digest, 'lifecycle', row_record.lifecycle_value
    ));
  end loop;
  response := jsonb_build_object(
    'resourceKind', 'content_type_version', 'resource', platform_private.cms_type_version_resource(version_row.id),
    'fields', fields, 'relations', relations,
    'schemaArtifact', (select jsonb_build_object('resourceKind', 'schema_artifact', 'id', artifact.id, 'version', artifact.version::text, 'state', artifact.state, 'contentTypeVersionId', artifact.content_type_version_id, 'compilerVersion', artifact.compiler_version, 'zodContractRef', artifact.zod_contract_ref, 'artifactHash', artifact.artifact_hash, 'createdAt', artifact.created_at, 'updatedAt', artifact.updated_at, 'compiledAt', artifact.compiled_at) from platform_private.cms_schema_artifacts artifact where artifact.id = version_row.schema_artifact_id),
    'templateBindings', templates, 'capabilityBindings', capabilities, 'blockDefinitions', blocks
  );
  return response;
end;
$body$;

-- The migration worker uses the same PostgREST profile as the client API, but
-- its RPCs are a distinct service-role-only surface.  These functions keep
-- lease, cursor, transition, event-claim, and DLQ state durable without
-- adding tables outside the twelve-table S09 boundary.  Event claims reuse
-- the append-only BE00 outbox and idempotency authorities.

create or replace function platform_private.cms_worker_require_request(
  p_request jsonb,
  p_required text[],
  p_allowed text[]
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
begin
  perform platform_private.cms_require_release_worker();
  if not platform_private.cms_json_bounded(p_request, 16384, 8, 64, 128)
     or not platform_private.cms_exact_keys(p_request, p_required, p_allowed) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  -- The write guard is transaction-local and may only be opened after the
  -- service-role principal and the exact request envelope are accepted.
  perform pg_catalog.set_config('app.cms_rpc', 'true', true);
end;
$body$;

create or replace function platform_private.cms_worker_uuid(
  p_value text,
  p_code text default 'INVALID_REQUEST'
)
returns uuid
language plpgsql
immutable
security definer
set search_path = ''
as $body$
begin
  if not platform_private.cms_valid_uuid(p_value) then
    raise exception '%', p_code using errcode = 'P0001';
  end if;
  return p_value::uuid;
exception when invalid_text_representation then
  raise exception '%', p_code using errcode = 'P0001';
end;
$body$;

create or replace function platform_private.cms_worker_positive(
  p_value text,
  p_code text default 'INVALID_REQUEST'
)
returns bigint
language plpgsql
immutable
security definer
set search_path = ''
as $body$
declare
  parsed bigint;
begin
  if p_value is null or p_value !~ '^[1-9][0-9]{0,17}$' then
    raise exception '%', p_code using errcode = 'P0001';
  end if;
  begin
    parsed := p_value::bigint;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception '%', p_code using errcode = 'P0001';
  end;
  if parsed < 1 then
    raise exception '%', p_code using errcode = 'P0001';
  end if;
  return parsed;
end;
$body$;

create or replace function platform_private.cms_worker_counter(
  p_value text,
  p_code text default 'INVALID_REQUEST'
)
returns bigint
language plpgsql
immutable
security definer
set search_path = ''
as $body$
declare
  parsed bigint;
begin
  if p_value is null or p_value !~ '^[0-9][0-9]{0,17}$' then
    raise exception '%', p_code using errcode = 'P0001';
  end if;
  begin
    parsed := p_value::bigint;
  exception when invalid_text_representation or numeric_value_out_of_range then
    raise exception '%', p_code using errcode = 'P0001';
  end;
  if parsed < 0 then
    raise exception '%', p_code using errcode = 'P0001';
  end if;
  return parsed;
end;
$body$;

create or replace function platform_private.cms_worker_time(
  p_value text
)
returns timestamptz
language plpgsql
stable
security definer
set search_path = ''
as $body$
begin
  if p_value is null or btrim(p_value) = '' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  return p_value::timestamptz;
exception when others then
  raise exception 'INVALID_REQUEST' using errcode = 'P0001';
end;
$body$;

create or replace function platform_private.cms_worker_hash(p_value text)
returns void
language plpgsql
immutable
security definer
set search_path = ''
as $body$
begin
  if not platform_private.cms_valid_hash(p_value) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
end;
$body$;

create or replace function platform_private.cms_worker_plan_json(p_plan_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  response jsonb;
begin
  select jsonb_build_object(
    'id', plan.id,
    'contentTypeId', plan.content_type_id,
    'fromVersionId', plan.from_version_id,
    'toVersionId', plan.to_version_id,
    'state', plan.state,
    'version', plan.version::text,
    'cursor', plan.cursor::text,
    'progress', plan.progress,
    'sourceCount', plan.source_count::text,
    'targetCount', plan.target_count::text,
    'rowErrorCount', plan.row_error_count::text,
    'migratedCount', plan.migrated_count::text,
    'failedCount', plan.failed_count::text,
    'classification', plan.classification,
    'transformKey', plan.transform_key,
    'transformVersion', plan.transform_version::text,
    'compilerHash', artifact.artifact_hash,
    'sourceHash', source_version.definition_hash,
    'targetHash', target_version.definition_hash,
    'activeVersionId', coalesce(active_version.id, source_version.id),
    'leaseOwner', nullif(plan.dry_run_report->'lease'->>'owner', ''),
    'leaseToken', nullif(plan.dry_run_report->'lease'->>'token', ''),
    'leaseExpiresAt', nullif(plan.dry_run_report->'lease'->>'expiresAt', '')
  )
    into response
    from platform_private.cms_schema_migration_plans plan
    join platform_private.cms_content_type_versions source_version
      on source_version.id = plan.from_version_id
     and source_version.content_type_id = plan.content_type_id
     and source_version.owner_id = plan.owner_id
    join platform_private.cms_content_type_versions target_version
      on target_version.id = plan.to_version_id
     and target_version.content_type_id = plan.content_type_id
     and target_version.owner_id = plan.owner_id
    join platform_private.cms_schema_artifacts artifact
      on artifact.id = target_version.schema_artifact_id
     and artifact.content_type_version_id = target_version.id
     and artifact.owner_id = plan.owner_id
     and artifact.state = 'compiled'
    left join platform_private.cms_content_type_versions active_version
      on active_version.content_type_id = plan.content_type_id
     and active_version.owner_id = plan.owner_id
     and active_version.state = 'active'
    where plan.id = p_plan_id;
  if response is null then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if not platform_private.cms_valid_hash(response->>'compilerHash')
     or not platform_private.cms_valid_hash(response->>'sourceHash')
     or not platform_private.cms_valid_hash(response->>'targetHash') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  return response;
end;
$body$;

create or replace function platform_private.cms_worker_validate_fingerprint(
  p_plan platform_private.cms_schema_migration_plans,
  p_request jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $body$
declare
  source_hash text;
  target_hash text;
  compiler_hash text;
  report_source_hash text;
  report_target_hash text;
  report_compiler_hash text;
  report_transform_hash text;
  report_compiler_version text;
  artifact_compiler_version text;
  target_dry_run_id text;
  recomputed_transform_hash text;
begin
  if not platform_private.cms_migration_source_evidence_valid(p_plan) then
    raise exception 'VALIDATION_FAILED'
      using detail = 'MIGRATION_SOURCE_EVIDENCE_REQUIRED', errcode = 'P0001';
  end if;
  select source_version.definition_hash, target_version.definition_hash,
         target_version.dry_run_id::text, artifact.artifact_hash,
         artifact.compiler_version
    into source_hash, target_hash, target_dry_run_id, compiler_hash,
         artifact_compiler_version
    from platform_private.cms_content_type_versions source_version
    join platform_private.cms_content_type_versions target_version
      on target_version.id = p_plan.to_version_id
     and target_version.content_type_id = p_plan.content_type_id
     and target_version.owner_id = p_plan.owner_id
    join platform_private.cms_schema_artifacts artifact
      on artifact.id = target_version.schema_artifact_id
     and artifact.content_type_version_id = target_version.id
     and artifact.owner_id = p_plan.owner_id
     and artifact.state = 'compiled'
   where source_version.id = p_plan.from_version_id
     and source_version.content_type_id = p_plan.content_type_id
     and source_version.owner_id = p_plan.owner_id;
  if not found
     or not platform_private.cms_valid_hash(source_hash)
     or not platform_private.cms_valid_hash(target_hash)
     or not platform_private.cms_valid_hash(compiler_hash) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_request->>'sourceHash' is distinct from source_hash
     or p_request->>'targetHash' is distinct from target_hash
     or p_request->>'compilerHash' is distinct from compiler_hash then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_plan.transform_key is null then
    if p_request->>'transformKey' is not null
       or p_request->>'transformVersion' is not null then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  elsif p_request->>'transformKey' is distinct from p_plan.transform_key
     or p_request->>'transformVersion' is distinct from p_plan.transform_version::text then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  report_source_hash := coalesce(
    p_plan.dry_run_report->>'sourceHash',
    p_plan.dry_run_report->>'sourceDefinitionHash'
  );
  report_target_hash := coalesce(
    p_plan.dry_run_report->>'targetHash',
    p_plan.dry_run_report->>'targetDefinitionHash'
  );
  report_compiler_hash := p_plan.dry_run_report->>'compilerHash';
  report_transform_hash := p_plan.dry_run_report->>'transformHash';
  report_compiler_version := p_plan.dry_run_report->>'compilerVersion';
  recomputed_transform_hash := platform_private.cms_migration_transform_hash(
    p_plan.classification,
    p_plan.transform_key,
    p_plan.transform_version,
    source_hash,
    target_hash,
    compiler_hash,
    artifact_compiler_version
  );
  if report_source_hash is distinct from source_hash
     or report_target_hash is distinct from target_hash
     or report_compiler_hash is distinct from compiler_hash
     or not platform_private.cms_valid_hash(report_transform_hash)
     or report_transform_hash is distinct from recomputed_transform_hash
     or report_compiler_version is distinct from artifact_compiler_version then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_plan.dry_run_report->>'result' <> 'pass'
     or not platform_private.cms_valid_uuid(target_dry_run_id)
     or p_plan.dry_run_report->>'dryRunId' is distinct from target_dry_run_id then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  -- Fingerprints alone are insufficient: a worker must carry forward the
  -- exact counters that the producer reported.  Keep this check independent
  -- of the mutable plan counters so a forged/missing report cannot become a
  -- valid lease hand-off.
  if not coalesce((
    p_plan.dry_run_report->>'sourceCount' ~ '^[0-9][0-9]{0,17}$'
    and p_plan.dry_run_report->>'targetCount' ~ '^[0-9][0-9]{0,17}$'
    and p_plan.dry_run_report->>'rowErrorCount' ~ '^[0-9][0-9]{0,17}$'
    and p_plan.dry_run_report->>'migratedCount' ~ '^[0-9][0-9]{0,17}$'
    and p_plan.dry_run_report->>'failedCount' ~ '^[0-9][0-9]{0,17}$'
  ), false) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if (p_plan.dry_run_report->>'sourceCount')::bigint <> p_plan.source_count
     or (p_plan.dry_run_report->>'targetCount')::bigint <> p_plan.target_count
     or (p_plan.dry_run_report->>'rowErrorCount')::bigint <> p_plan.row_error_count
     or (p_plan.dry_run_report->>'migratedCount')::bigint <> p_plan.migrated_count
     or (p_plan.dry_run_report->>'failedCount')::bigint <> p_plan.failed_count then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_plan.transform_key is not null
     and (p_plan.dry_run_report->>'transformKey' is distinct from p_plan.transform_key
       or p_plan.dry_run_report->>'transformVersion' is distinct from p_plan.transform_version::text) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  -- A ready/live hand-off is not valid until the producer snapshot exists in
  -- the independent immutable authority.  Draft/dry-running rows are allowed
  -- to reach the finalizer, which creates that snapshot before returning ready.
  if p_plan.state in ('ready', 'running', 'verifying', 'completed')
     and not platform_private.cms_persisted_dry_run_report_valid(
       case when platform_private.cms_valid_uuid(p_plan.dry_run_report->>'dryRunId')
         then (p_plan.dry_run_report->>'dryRunId')::uuid else null end,
       p_plan.owner_id,
       p_plan.content_type_id,
       p_plan.from_version_id,
       p_plan.to_version_id,
       p_plan.classification,
       p_plan.transform_key,
       p_plan.transform_version,
       source_hash,
       target_hash,
       compiler_hash,
       artifact_compiler_version
     ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
end;
$body$;

create or replace function platform_private.cms_worker_lease_valid(
  p_plan platform_private.cms_schema_migration_plans,
  p_lease_token text,
  p_worker_id text default null,
  p_now timestamptz default pg_catalog.clock_timestamp()
)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $body$
declare
  expires_at timestamptz;
begin
  if p_lease_token is null
     or p_plan.dry_run_report->'lease'->>'token' is distinct from p_lease_token
     or (p_worker_id is not null
       and p_plan.dry_run_report->'lease'->>'owner' is distinct from p_worker_id) then
    return false;
  end if;
  begin
    expires_at := (p_plan.dry_run_report->'lease'->>'expiresAt')::timestamptz;
  exception when others then
    return false;
  end;
  return expires_at is not null and expires_at > p_now;
end;
$body$;

create or replace function platform_private.cms_worker_set_report(
  p_report jsonb,
  p_lease_state text,
  p_owner text,
  p_token text,
  p_expires_at timestamptz,
  p_source_count bigint default null,
  p_target_count bigint default null,
  p_row_error_count bigint default null,
  p_migrated_count bigint default null,
  p_failed_count bigint default null
)
returns jsonb
language sql
immutable
security definer
set search_path = ''
as $body$
  select coalesce(p_report, '{}'::jsonb)
    || jsonb_build_object(
      'lease', jsonb_build_object(
        'state', p_lease_state,
        'owner', p_owner,
        'token', p_token,
        'expiresAt', p_expires_at
      )
    )
    || case when p_source_count is null then '{}'::jsonb
            else jsonb_build_object('sourceCount', p_source_count::text) end
    || case when p_target_count is null then '{}'::jsonb
            else jsonb_build_object('targetCount', p_target_count::text) end
    || case when p_row_error_count is null then '{}'::jsonb
            else jsonb_build_object('rowErrorCount', p_row_error_count::text) end
    || case when p_migrated_count is null then '{}'::jsonb
            else jsonb_build_object('migratedCount', p_migrated_count::text) end
    || case when p_failed_count is null then '{}'::jsonb
            else jsonb_build_object('failedCount', p_failed_count::text) end
$body$;

create or replace function platform_private.cms_get_schema_migration_plan(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  schema_version_id uuid;
  expected_version bigint;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array['migrationPlanId', 'schemaVersionId', 'expectedVersion']::text[],
    array['migrationPlanId', 'schemaVersionId', 'expectedVersion']::text[]
  );
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  schema_version_id := platform_private.cms_worker_uuid(p_request->>'schemaVersionId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.to_version_id <> schema_version_id then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if plan_row.version <> expected_version and plan_row.state <> 'completed' then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  return platform_private.cms_worker_plan_json(plan_id);
end;
$body$;

create or replace function platform_private.cms_claim_schema_migration_lease(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  schema_version_id uuid;
  expected_version bigint;
  expected_cursor bigint;
  lease_duration bigint;
  now_at timestamptz;
  worker_id text := p_request->>'workerId';
  lease_owner text := p_request->>'leaseOwner';
  existing_expires_at timestamptz;
  existing_owner text;
  next_state text;
  lease_token text;
  lease_expires_at timestamptz;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'migrationPlanId', 'schemaVersionId', 'expectedVersion', 'cursor',
      'leaseOwner', 'workerId', 'leaseDurationMs', 'now', 'transformKey',
      'transformVersion', 'compilerHash', 'sourceHash', 'targetHash'
    ]::text[],
    array[
      'migrationPlanId', 'schemaVersionId', 'expectedVersion', 'cursor',
      'leaseOwner', 'workerId', 'leaseDurationMs', 'now', 'transformKey',
      'transformVersion', 'compilerHash', 'sourceHash', 'targetHash'
    ]::text[]
  );
  if worker_id is null or worker_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
     or lease_owner is distinct from worker_id then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  schema_version_id := platform_private.cms_worker_uuid(p_request->>'schemaVersionId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  expected_cursor := platform_private.cms_worker_counter(p_request->>'cursor');
  lease_duration := platform_private.cms_worker_counter(p_request->>'leaseDurationMs');
  if lease_duration not between 1 and 900000 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  now_at := platform_private.cms_worker_time(p_request->>'now');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.to_version_id <> schema_version_id
     or plan_row.version <> expected_version
     or plan_row.cursor <> expected_cursor then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  perform platform_private.cms_worker_validate_fingerprint(plan_row, p_request);
  begin
    existing_expires_at := (plan_row.dry_run_report->'lease'->>'expiresAt')::timestamptz;
  exception when others then
    existing_expires_at := null;
  end;
  existing_owner := plan_row.dry_run_report->'lease'->>'owner';
  if existing_expires_at is not null
     and existing_expires_at > now_at
     and existing_owner is distinct from worker_id then
    return jsonb_build_object(
      'acquired', false, 'leaseToken', null, 'plan', null,
      'reasonCode', 'LEASE_UNAVAILABLE'
    );
  end if;
  if plan_row.state not in ('draft', 'dry_running', 'ready', 'running', 'failed_retryable') then
    return jsonb_build_object(
      'acquired', false, 'leaseToken', null, 'plan', null,
      'reasonCode', 'MIGRATION_STATE_UNAVAILABLE'
    );
  end if;
  next_state := case plan_row.state
    when 'draft' then 'dry_running'
    when 'ready' then 'running'
    when 'failed_retryable' then 'running'
    else plan_row.state
  end;
  lease_token := extensions.gen_random_uuid()::text;
  lease_expires_at := now_at + pg_catalog.make_interval(secs => lease_duration / 1000.0);
  update platform_private.cms_schema_migration_plans
     set state = next_state,
         version = version + 1,
         updated_at = now_at,
         started_at = coalesce(started_at, now_at),
         dry_run_report = platform_private.cms_worker_set_report(
           dry_run_report, 'leased', lease_owner, lease_token, lease_expires_at,
           source_count, target_count, row_error_count, migrated_count, failed_count
         )
   where id = plan_id and version = expected_version;
  if not found then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  return jsonb_build_object(
    'acquired', true,
    'leaseToken', lease_token,
    'plan', platform_private.cms_worker_plan_json(plan_id),
    'reasonCode', null
  );
end;
$body$;

create or replace function platform_private.cms_heartbeat_schema_migration_lease(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  expected_version bigint;
  expected_cursor bigint;
  lease_duration bigint;
  now_at timestamptz;
  worker_id text := p_request->>'workerId';
  lease_token text := p_request->>'leaseToken';
  lease_expires_at timestamptz;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'migrationPlanId', 'expectedVersion', 'cursor', 'leaseToken',
      'workerId', 'now', 'leaseDurationMs'
    ]::text[],
    array[
      'migrationPlanId', 'expectedVersion', 'cursor', 'leaseToken',
      'workerId', 'now', 'leaseDurationMs'
    ]::text[]
  );
  if worker_id is null or worker_id !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$'
     or lease_token is null or lease_token !~ '^[A-Za-z0-9._:-]{1,200}$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  expected_cursor := platform_private.cms_worker_counter(p_request->>'cursor');
  lease_duration := platform_private.cms_worker_counter(p_request->>'leaseDurationMs');
  if lease_duration not between 1 and 900000 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  now_at := platform_private.cms_worker_time(p_request->>'now');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.version <> expected_version or plan_row.cursor <> expected_cursor then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if not platform_private.cms_worker_lease_valid(plan_row, lease_token, worker_id, now_at) then
    return jsonb_build_object('renewed', false, 'reasonCode', 'LEASE_EXPIRED');
  end if;
  lease_expires_at := now_at + pg_catalog.make_interval(secs => lease_duration / 1000.0);
  update platform_private.cms_schema_migration_plans
     set updated_at = now_at,
         dry_run_report = platform_private.cms_worker_set_report(
           dry_run_report,
           case when state = 'dry_running' then 'leased' else 'running' end,
           worker_id, lease_token, lease_expires_at
         )
   where id = plan_id and version = expected_version and cursor = expected_cursor;
  if not found then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  return jsonb_build_object(
    'renewed', true,
    'version', expected_version::text,
    'leaseExpiresAt', lease_expires_at
  );
end;
$body$;

create or replace function platform_private.cms_process_schema_migration_batch(
  p_request jsonb,
  p_dry_run boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  schema_version_id uuid;
  expected_version bigint;
  current_cursor bigint;
  batch_limit bigint;
  now_at timestamptz := pg_catalog.clock_timestamp();
  processed bigint;
  next_cursor bigint;
  next_target_count bigint;
  next_migrated_count bigint;
  next_progress numeric(9, 6);
  done boolean;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'migrationPlanId', 'schemaVersionId', 'expectedVersion', 'cursor', 'limit',
      'leaseToken', 'transformKey', 'transformVersion', 'compilerHash',
      'sourceHash', 'targetHash', 'correlationId', 'causationId'
    ]::text[],
    array[
      'migrationPlanId', 'schemaVersionId', 'expectedVersion', 'cursor', 'limit',
      'leaseToken', 'transformKey', 'transformVersion', 'compilerHash',
      'sourceHash', 'targetHash', 'correlationId', 'causationId'
    ]::text[]
  );
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  schema_version_id := platform_private.cms_worker_uuid(p_request->>'schemaVersionId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  current_cursor := platform_private.cms_worker_counter(p_request->>'cursor');
  batch_limit := platform_private.cms_worker_counter(p_request->>'limit');
  if batch_limit not between 1 and 128 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_request->>'correlationId' is null
     or not platform_private.cms_valid_uuid(p_request->>'correlationId')
     or (p_request->'causationId' <> 'null'::jsonb
       and not platform_private.cms_valid_uuid(p_request->>'causationId')) then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.to_version_id <> schema_version_id
     or plan_row.version <> expected_version
     or plan_row.cursor <> current_cursor then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if p_dry_run and plan_row.state <> 'dry_running'
     or not p_dry_run and plan_row.state <> 'running' then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if not platform_private.cms_migration_source_evidence_valid(plan_row) then
    raise exception 'VALIDATION_FAILED'
      using detail = 'MIGRATION_SOURCE_EVIDENCE_REQUIRED', errcode = 'P0001';
  end if;
  if not platform_private.cms_worker_lease_valid(
    plan_row, p_request->>'leaseToken', null, now_at
  ) then
    raise exception 'LEASE_EXPIRED' using errcode = 'P0001';
  end if;
  perform platform_private.cms_worker_validate_fingerprint(plan_row, p_request);
  if current_cursor > plan_row.source_count then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  processed := least(batch_limit, plan_row.source_count - current_cursor);
  next_cursor := current_cursor + processed;
  next_target_count := greatest(plan_row.target_count, next_cursor);
  next_migrated_count := case when p_dry_run
    then plan_row.migrated_count
    else greatest(plan_row.migrated_count, next_cursor)
  end;
  next_progress := case when plan_row.source_count = 0 then 1
    else least(1, next_cursor::numeric / plan_row.source_count::numeric) end;
  done := next_cursor >= plan_row.source_count;
  update platform_private.cms_schema_migration_plans
     set cursor = next_cursor,
         progress = next_progress,
         target_count = next_target_count,
         migrated_count = next_migrated_count,
         updated_at = now_at,
         dry_run_report = platform_private.cms_worker_set_report(
           dry_run_report,
           case when p_dry_run then 'leased' else 'running' end,
           dry_run_report->'lease'->>'owner',
           dry_run_report->'lease'->>'token',
           (dry_run_report->'lease'->>'expiresAt')::timestamptz,
           plan_row.source_count, next_target_count, plan_row.row_error_count,
           next_migrated_count, plan_row.failed_count
         )
   where id = plan_id and version = expected_version and cursor = current_cursor;
  if not found then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  return jsonb_build_object(
    'done', done,
    'cursor', next_cursor::text,
    'progress', next_progress,
    'sourceCount', plan_row.source_count::text,
    'targetCount', next_target_count::text,
    'rowErrorCount', plan_row.row_error_count::text,
    'migratedCount', next_migrated_count::text,
    'failedCount', plan_row.failed_count::text
  );
end;
$body$;

create or replace function platform_private.cms_process_schema_migration_dry_run_batch(
  p_request jsonb
)
returns jsonb
language sql
security definer
set search_path = ''
as $body$
  select platform_private.cms_process_schema_migration_batch(p_request, true)
$body$;

create or replace function platform_private.cms_finalize_schema_migration_dry_run(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  expected_version bigint;
  request_cursor bigint;
  request_source_count bigint;
  request_target_count bigint;
  request_row_error_count bigint;
  now_at timestamptz := pg_catalog.clock_timestamp();
  plan_row platform_private.cms_schema_migration_plans%rowtype;
  next_state text;
  lease_expires_at timestamptz;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'migrationPlanId', 'expectedVersion', 'cursor', 'sourceCount',
      'targetCount', 'rowErrorCount', 'transformKey', 'transformVersion',
      'compilerHash', 'sourceHash', 'targetHash'
    ]::text[],
    array[
      'migrationPlanId', 'expectedVersion', 'cursor', 'sourceCount',
      'targetCount', 'rowErrorCount', 'transformKey', 'transformVersion',
      'compilerHash', 'sourceHash', 'targetHash'
    ]::text[]
  );
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  request_cursor := platform_private.cms_worker_counter(p_request->>'cursor');
  request_source_count := platform_private.cms_worker_counter(p_request->>'sourceCount');
  request_target_count := platform_private.cms_worker_counter(p_request->>'targetCount');
  request_row_error_count := platform_private.cms_worker_counter(p_request->>'rowErrorCount');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.state <> 'dry_running'
     or plan_row.version <> expected_version
     or plan_row.cursor <> request_cursor
     or plan_row.source_count <> request_source_count
     or plan_row.target_count <> request_target_count
     or plan_row.row_error_count <> request_row_error_count then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  perform platform_private.cms_worker_validate_fingerprint(plan_row, p_request);
  if not platform_private.cms_worker_lease_valid(
    plan_row,
    plan_row.dry_run_report->'lease'->>'token',
    null,
    now_at
  ) then
    raise exception 'LEASE_EXPIRED' using errcode = 'P0001';
  end if;
  next_state := case when request_row_error_count = 0 then 'ready' else 'blocked' end;
  begin
    lease_expires_at := (plan_row.dry_run_report->'lease'->>'expiresAt')::timestamptz;
  exception when others then
    lease_expires_at := null;
  end;
  if lease_expires_at is null or lease_expires_at <= now_at then
    lease_expires_at := now_at + interval '15 minutes';
  end if;
  update platform_private.cms_schema_migration_plans
     set state = next_state,
         version = version + 1,
         updated_at = now_at,
         dry_run_report = platform_private.cms_worker_set_report(
           dry_run_report, next_state, dry_run_report->'lease'->>'owner',
           dry_run_report->'lease'->>'token', lease_expires_at,
           request_source_count, request_target_count, request_row_error_count,
           migrated_count, failed_count
         ) || jsonb_build_object(
           'result', case when next_state = 'ready' then 'pass' else 'blocked' end
         )
   where id = plan_id and version = expected_version;
  if not found then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  -- Freeze the producer's dry-run snapshot before returning the resumable
  -- plan.  Subsequent lease/cursor updates may change the plan JSON, but this
  -- independent row is never updated and is what activation verifies.
  insert into platform_private.cms_schema_dry_run_reports(
    id, owner_id, content_type_id, source_version_id, target_version_id,
    classification, transform_key, transform_version, source_hash, target_hash,
    compiler_hash, compiler_version, source_count, target_count,
    row_error_count, migrated_count, failed_count, result, report, created_by
  )
  select target_version.dry_run_id, plan.owner_id, plan.content_type_id,
         source_version.id, target_version.id, plan.classification,
         plan.transform_key, plan.transform_version, source_version.definition_hash,
         target_version.definition_hash, artifact.artifact_hash,
         artifact.compiler_version, plan.source_count, plan.target_count,
         plan.row_error_count, plan.migrated_count, plan.failed_count,
         plan.dry_run_report->>'result', plan.dry_run_report, target_version.created_by
    from platform_private.cms_schema_migration_plans plan
    join platform_private.cms_content_type_versions source_version
      on source_version.id = plan.from_version_id
     and source_version.content_type_id = plan.content_type_id
     and source_version.owner_id = plan.owner_id
    join platform_private.cms_content_type_versions target_version
      on target_version.id = plan.to_version_id
     and target_version.content_type_id = plan.content_type_id
     and target_version.owner_id = plan.owner_id
    join platform_private.cms_schema_artifacts artifact
      on artifact.id = target_version.schema_artifact_id
     and artifact.content_type_version_id = target_version.id
     and artifact.owner_id = plan.owner_id
     and artifact.state = 'compiled'
   where plan.id = plan_id
     and next_state = 'ready'
  on conflict (id) do nothing;
  return platform_private.cms_worker_plan_json(plan_id);
end;
$body$;

create or replace function platform_private.cms_begin_schema_migration_verification(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  expected_version bigint;
  request_cursor bigint;
  request_source_count bigint;
  request_target_count bigint;
  request_row_error_count bigint;
  request_migrated_count bigint;
  request_failed_count bigint;
  now_at timestamptz := pg_catalog.clock_timestamp();
  plan_row platform_private.cms_schema_migration_plans%rowtype;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'migrationPlanId', 'expectedVersion', 'cursor', 'sourceCount',
      'targetCount', 'rowErrorCount', 'migratedCount', 'failedCount',
      'transformKey', 'transformVersion', 'compilerHash', 'sourceHash',
      'targetHash'
    ]::text[],
    array[
      'migrationPlanId', 'expectedVersion', 'cursor', 'sourceCount',
      'targetCount', 'rowErrorCount', 'migratedCount', 'failedCount',
      'transformKey', 'transformVersion', 'compilerHash', 'sourceHash',
      'targetHash'
    ]::text[]
  );
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  request_cursor := platform_private.cms_worker_counter(p_request->>'cursor');
  request_source_count := platform_private.cms_worker_counter(p_request->>'sourceCount');
  request_target_count := platform_private.cms_worker_counter(p_request->>'targetCount');
  request_row_error_count := platform_private.cms_worker_counter(p_request->>'rowErrorCount');
  request_migrated_count := platform_private.cms_worker_counter(p_request->>'migratedCount');
  request_failed_count := platform_private.cms_worker_counter(p_request->>'failedCount');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.state <> 'running'
     or plan_row.version <> expected_version
     or plan_row.cursor <> request_cursor
     or plan_row.source_count <> request_source_count
     or plan_row.target_count <> request_target_count
     or plan_row.row_error_count <> request_row_error_count
     or plan_row.migrated_count <> request_migrated_count
     or plan_row.failed_count <> request_failed_count then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if request_row_error_count > 0 or request_failed_count > 0 then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  perform platform_private.cms_worker_validate_fingerprint(plan_row, p_request);
  if not platform_private.cms_worker_lease_valid(
    plan_row,
    plan_row.dry_run_report->'lease'->>'token',
    null,
    now_at
  ) then
    raise exception 'LEASE_EXPIRED' using errcode = 'P0001';
  end if;
  update platform_private.cms_schema_migration_plans
     set state = 'verifying',
         version = version + 1,
         updated_at = now_at,
         dry_run_report = platform_private.cms_worker_set_report(
           dry_run_report, 'verifying', dry_run_report->'lease'->>'owner',
           dry_run_report->'lease'->>'token',
           (dry_run_report->'lease'->>'expiresAt')::timestamptz,
           request_source_count, request_target_count, request_row_error_count,
           request_migrated_count, request_failed_count
         )
   where id = plan_id and version = expected_version;
  if not found then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  return platform_private.cms_worker_plan_json(plan_id);
end;
$body$;

create or replace function platform_private.cms_verify_schema_migration(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  expected_version bigint;
  request_cursor bigint;
  request_source_count bigint;
  request_target_count bigint;
  request_row_error_count bigint;
  request_migrated_count bigint;
  request_failed_count bigint;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
  now_at timestamptz := pg_catalog.clock_timestamp();
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'migrationPlanId', 'schemaVersionId', 'expectedVersion', 'cursor',
      'leaseToken', 'sourceCount', 'targetCount', 'rowErrorCount',
      'migratedCount', 'failedCount', 'transformKey', 'transformVersion',
      'compilerHash', 'sourceHash', 'targetHash'
    ]::text[],
    array[
      'migrationPlanId', 'schemaVersionId', 'expectedVersion', 'cursor',
      'leaseToken', 'sourceCount', 'targetCount', 'rowErrorCount',
      'migratedCount', 'failedCount', 'transformKey', 'transformVersion',
      'compilerHash', 'sourceHash', 'targetHash'
    ]::text[]
  );
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  if not platform_private.cms_valid_uuid(p_request->>'schemaVersionId') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  request_cursor := platform_private.cms_worker_counter(p_request->>'cursor');
  request_source_count := platform_private.cms_worker_counter(p_request->>'sourceCount');
  request_target_count := platform_private.cms_worker_counter(p_request->>'targetCount');
  request_row_error_count := platform_private.cms_worker_counter(p_request->>'rowErrorCount');
  request_migrated_count := platform_private.cms_worker_counter(p_request->>'migratedCount');
  request_failed_count := platform_private.cms_worker_counter(p_request->>'failedCount');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.to_version_id::text is distinct from p_request->>'schemaVersionId'
     or plan_row.state <> 'verifying'
     or plan_row.version <> expected_version
     or plan_row.cursor <> request_cursor
     or plan_row.source_count <> request_source_count
     or plan_row.target_count <> request_target_count
     or plan_row.row_error_count <> request_row_error_count
     or plan_row.migrated_count <> request_migrated_count
     or plan_row.failed_count <> request_failed_count then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if not platform_private.cms_worker_lease_valid(
    plan_row, p_request->>'leaseToken', null, now_at
  ) then
    raise exception 'LEASE_EXPIRED' using errcode = 'P0001';
  end if;
  perform platform_private.cms_worker_validate_fingerprint(plan_row, p_request);
  if request_row_error_count > 0 or request_failed_count > 0 then
    return jsonb_build_object('valid', false, 'reasonCode', 'MIGRATION_COUNTER_ERROR');
  end if;
  return jsonb_build_object('valid', true, 'reasonCode', null);
end;
$body$;

create or replace function platform_private.cms_complete_schema_migration(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  expected_version bigint;
  now_at timestamptz := pg_catalog.clock_timestamp();
  plan_row platform_private.cms_schema_migration_plans%rowtype;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array['migrationPlanId', 'expectedVersion', 'leaseToken']::text[],
    array['migrationPlanId', 'expectedVersion', 'leaseToken']::text[]
  );
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if not platform_private.cms_migration_source_evidence_valid(plan_row) then
    raise exception 'VALIDATION_FAILED'
      using detail = 'MIGRATION_SOURCE_EVIDENCE_REQUIRED', errcode = 'P0001';
  end if;
  if plan_row.state = 'completed' then
    return platform_private.cms_worker_plan_json(plan_id);
  end if;
  if plan_row.state <> 'verifying' or plan_row.version <> expected_version then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if not platform_private.cms_worker_lease_valid(
    plan_row, p_request->>'leaseToken', null, now_at
  ) then
    raise exception 'LEASE_EXPIRED' using errcode = 'P0001';
  end if;
  update platform_private.cms_schema_migration_plans
     set state = 'completed',
         version = version + 1,
         updated_at = now_at,
         completed_at = now_at,
         dry_run_report = platform_private.cms_worker_set_report(
           dry_run_report, 'completed', null, null,
           greatest(
             now_at + interval '15 minutes',
             (dry_run_report->'lease'->>'expiresAt')::timestamptz
           ),
           source_count, target_count, row_error_count, migrated_count, failed_count
         )
   where id = plan_id and version = expected_version;
  if not found then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  return platform_private.cms_worker_plan_json(plan_id);
end;
$body$;

create or replace function platform_private.cms_rollback_schema_migration(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  schema_version_id uuid;
  expected_version bigint;
  request_cursor bigint;
  fallback_version_id uuid;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
  now_at timestamptz := pg_catalog.clock_timestamp();
  rollback_state text;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'migrationPlanId', 'schemaVersionId', 'expectedVersion', 'cursor',
      'leaseToken', 'reasonCode', 'retryable', 'fallbackVersionId',
      'preserveOldActive', 'deleteRows', 'transformKey', 'transformVersion',
      'compilerHash', 'sourceHash', 'targetHash'
    ]::text[],
    array[
      'migrationPlanId', 'schemaVersionId', 'expectedVersion', 'cursor',
      'leaseToken', 'reasonCode', 'retryable', 'fallbackVersionId',
      'preserveOldActive', 'deleteRows', 'transformKey', 'transformVersion',
      'compilerHash', 'sourceHash', 'targetHash'
    ]::text[]
  );
  if p_request->>'reasonCode' is null
     or p_request->>'reasonCode' !~ '^[A-Z][A-Z0-9_.-]{0,63}$'
     or p_request->'retryable' is distinct from 'true'::jsonb
       and p_request->'retryable' is distinct from 'false'::jsonb
     or p_request->'preserveOldActive' is distinct from 'true'::jsonb
     or p_request->'deleteRows' is distinct from 'false'::jsonb then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  schema_version_id := platform_private.cms_worker_uuid(p_request->>'schemaVersionId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  request_cursor := platform_private.cms_worker_counter(p_request->>'cursor');
  fallback_version_id := platform_private.cms_worker_uuid(p_request->>'fallbackVersionId');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.to_version_id <> schema_version_id
     or plan_row.from_version_id <> fallback_version_id
     or plan_row.version <> expected_version
     or plan_row.cursor <> request_cursor then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if plan_row.state not in ('running', 'verifying', 'failed_retryable') then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if not platform_private.cms_worker_lease_valid(
    plan_row, p_request->>'leaseToken', null, now_at
  ) then
    raise exception 'LEASE_EXPIRED' using errcode = 'P0001';
  end if;
  perform platform_private.cms_worker_validate_fingerprint(plan_row, p_request);
  rollback_state := case when (p_request->'retryable')::boolean
    then 'failed_retryable' else 'failed_terminal' end;
  update platform_private.cms_schema_migration_plans
     set state = rollback_state,
         version = version + 1,
         updated_at = now_at,
         dry_run_report = platform_private.cms_worker_set_report(
           dry_run_report, rollback_state, null, null,
           now_at + interval '15 minutes',
           source_count, target_count, row_error_count, migrated_count, failed_count
         )
   where id = plan_id and version = expected_version;
  if not found then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  return jsonb_build_object('plan', platform_private.cms_worker_plan_json(plan_id));
end;
$body$;

create or replace function platform_private.cms_worker_human_approval_valid(
  p_candidate_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $body$
declare
  candidate platform_private.cms_content_type_versions%rowtype;
  required_decision_count integer;
  approval_count integer;
  distinct_approver_count integer;
  approval_hash text;
  expected_policy_hash text;
  expected_evidence_hash text;
  review_context_hash text;
  risk_class text;
  approval_candidate_version bigint;
  validation_at timestamptz;
begin
  select * into candidate
    from platform_private.cms_content_type_versions version_row
   where version_row.id = p_candidate_id
   for update;
  if not found then
    return false;
  end if;
  risk_class := platform_private.cms_activation_risk_class(candidate.workflow_key);
  -- Human activation increments the candidate version after recording the
  -- immutable review evidence.  A post-activation worker/replay validation
  -- therefore resolves that evidence at the immediately preceding version;
  -- pending worker activation continues to use the current candidate version.
  approval_candidate_version := candidate.version;
  if candidate.state in ('active', 'superseded', 'retired') then
    approval_candidate_version := candidate.version - 1;
  end if;
  -- Worker replay has no caller-authoritative approval/context payload.  Lock
  -- the same evidence and authority rows as the human path, then resolve all
  -- freshness checks from the persisted review boundary.
  perform platform_private.cms_lock_activation_graph(candidate.id);
  perform platform_private.cms_lock_activation_authority(
    candidate.id, candidate.created_by, null
  );
  validation_at := pg_catalog.clock_timestamp();
  select review.effective_context_hash
    into review_context_hash
    from platform_private.cfg_config_change_reviews review
   where review.candidate_type = 'setting_value'
     and review.candidate_id = candidate.id
     and review.candidate_version = approval_candidate_version
     and review.frozen_hash = candidate.definition_hash
     and review.state = 'approved'
     and review.risk_class in ('high', 'emergency')
     and review.submitted_by = candidate.created_by
     and review.effective_context_hash ~ '^[a-f0-9]{64}$'
     and review.submitted_at >= validation_at - interval '10 minutes'
     and review.submitted_at <= validation_at
   order by review.updated_at desc, review.id desc
   limit 1;
  if review_context_hash is null
     or not exists (
       select 1
       from platform_private.acting_context_binding context_binding
       where context_binding.person_id = platform_private.identity_actor_person(candidate.created_by)
         and context_binding.acting_party_id = candidate.owner_id
         and context_binding.state = 'active'
         and context_binding.expires_at > validation_at
         and context_binding.last_seen_at >= validation_at - interval '10 minutes'
         and platform_private.cfg_hash_json(jsonb_build_object(
           'actingContextId', context_binding.id::text
         )) = review_context_hash
     ) then
    return false;
  end if;
  if candidate.activation_workflow_policy_key is distinct from 'cms.schema.activate'
     or candidate.activation_workflow_policy_version is distinct from 1
     or candidate.activation_required_capabilities is distinct from
       jsonb_build_array('cms.schema_designer')
     or not platform_private.cms_valid_hash(candidate.activation_workflow_policy_hash)
     or not platform_private.cms_valid_hash(candidate.activation_approval_evidence_hash) then
    return false;
  end if;
  select coalesce(max(review.required_approvals), 1)
    into required_decision_count
    from platform_private.cfg_config_change_reviews review
   where review.candidate_type = 'setting_value'
     and review.candidate_id = candidate.id
     and review.candidate_version = approval_candidate_version
     and review.frozen_hash = candidate.definition_hash
     and review.state = 'approved'
     and review.risk_class in ('high', 'emergency')
     and review.submitted_by = candidate.created_by
     and review.effective_context_hash = review_context_hash
     and review.submitted_at >= validation_at - interval '10 minutes'
     and review.submitted_at <= validation_at;
  if candidate.activation_required_decision_count is distinct from
       required_decision_count then
    return false;
  end if;
  if risk_class = 'protected' and required_decision_count < 2 then
    return false;
  end if;
  expected_policy_hash := encode(extensions.digest(convert_to(
    'cms.schema.activate:1:' || required_decision_count || ':'
      || jsonb_build_array('cms.schema_designer')::text,
    'utf8'
  ), 'sha256'), 'hex');
  if candidate.activation_workflow_policy_hash is distinct from expected_policy_hash then
    return false;
  end if;
  select count(*), count(distinct approval.reviewer_person_id)
    into approval_count, distinct_approver_count
    from platform_private.cfg_config_approvals approval
    join platform_private.cfg_config_change_reviews review
      on review.id = approval.review_id
   where review.candidate_type = 'setting_value'
     and review.candidate_id = candidate.id
     and review.candidate_version = approval_candidate_version
     and review.frozen_hash = candidate.definition_hash
     and review.state = 'approved'
     and review.risk_class in ('high', 'emergency')
     and review.submitted_by = candidate.created_by
     and review.effective_context_hash = review_context_hash
     and review.submitted_at >= validation_at - interval '10 minutes'
     and review.submitted_at <= validation_at
     and exists (
       select 1
       from platform_private.acting_context_binding context_binding
       where context_binding.person_id = platform_private.identity_actor_person(candidate.created_by)
         and context_binding.acting_party_id = candidate.owner_id
         and context_binding.state = 'active'
         and context_binding.expires_at > validation_at
         and context_binding.last_seen_at >= validation_at - interval '10 minutes'
         and platform_private.cfg_hash_json(jsonb_build_object(
           'actingContextId', context_binding.id::text
         )) = review_context_hash
     )
     and approval.decision = 'approve'
     and approval.reviewed_hash = candidate.definition_hash
     and approval.capability = 'cms.schema_designer'
     and approval.review_version = review.version_no
     and approval.decided_at <= validation_at
     and approval.decided_at >= validation_at - interval '10 minutes'
     and approval.reviewer_person_id <> candidate.created_by
     and exists (
       select 1
       from identity_private.membership_tenure tenure
       join identity_private.organization_actor_grant actor_grant
         on actor_grant.organization_id = tenure.organization_id
        and actor_grant.person_id = tenure.person_id
       where tenure.organization_id = candidate.owner_id
         and tenure.person_id = platform_private.identity_actor_person(
           approval.reviewer_person_id
         )
         and tenure.state = 'confirmed'
         and (tenure.ends_on is null or tenure.ends_on >= current_date)
         and actor_grant.capability_code = approval.capability
         and actor_grant.active
         and actor_grant.valid_from <= current_date
         and (actor_grant.valid_through is null or actor_grant.valid_through >= current_date)
     );
  if approval_count < required_decision_count
     or approval_count <> distinct_approver_count then
    return false;
  end if;
  select encode(extensions.digest(convert_to(
    coalesce(jsonb_agg(jsonb_build_object(
      'reviewId', approval.review_id,
      'reviewerAuthUserId', approval.reviewer_person_id,
      'capability', approval.capability,
      'reviewedHash', approval.reviewed_hash,
      'reviewVersion', approval.review_version,
      'decidedAt', approval.decided_at
    ) order by approval.review_id, approval.reviewer_person_id)::text, '[]'),
    'utf8'
  ), 'sha256'), 'hex')
    into approval_hash
    from platform_private.cfg_config_approvals approval
    join platform_private.cfg_config_change_reviews review
      on review.id = approval.review_id
   where review.candidate_type = 'setting_value'
     and review.candidate_id = candidate.id
     and review.candidate_version = approval_candidate_version
     and review.frozen_hash = candidate.definition_hash
     and review.state = 'approved'
     and review.risk_class in ('high', 'emergency')
    and review.submitted_by = candidate.created_by
    and review.effective_context_hash = review_context_hash
    and review.submitted_at >= validation_at - interval '10 minutes'
    and review.submitted_at <= validation_at
    and exists (
      select 1
      from platform_private.acting_context_binding context_binding
      where context_binding.person_id = platform_private.identity_actor_person(candidate.created_by)
        and context_binding.acting_party_id = candidate.owner_id
        and context_binding.state = 'active'
        and context_binding.expires_at > validation_at
        and context_binding.last_seen_at >= validation_at - interval '10 minutes'
        and platform_private.cfg_hash_json(jsonb_build_object(
          'actingContextId', context_binding.id::text
        )) = review_context_hash
    )
    and approval.decision = 'approve'
    and approval.reviewed_hash = candidate.definition_hash
    and approval.capability = 'cms.schema_designer'
    and approval.review_version = review.version_no
    and approval.decided_at <= validation_at
    and approval.decided_at >= validation_at - interval '10 minutes'
    and approval.reviewer_person_id <> candidate.created_by
    and exists (
      select 1
      from identity_private.membership_tenure tenure
      join identity_private.organization_actor_grant actor_grant
        on actor_grant.organization_id = tenure.organization_id
       and actor_grant.person_id = tenure.person_id
      where tenure.organization_id = candidate.owner_id
        and tenure.person_id = platform_private.identity_actor_person(approval.reviewer_person_id)
        and tenure.state = 'confirmed'
        and (tenure.ends_on is null or tenure.ends_on >= current_date)
        and actor_grant.capability_code = approval.capability
        and actor_grant.active
        and actor_grant.valid_from <= current_date
        and (actor_grant.valid_through is null or actor_grant.valid_through >= current_date)
    );
  expected_evidence_hash := encode(extensions.digest(convert_to(
    jsonb_build_object(
      'key', 'cms.schema.activate',
      'version', '1',
      'policyHash', expected_policy_hash,
      'riskClass', risk_class,
      'requiredDecisionCount', required_decision_count,
      'requiredCapabilities', jsonb_build_array('cms.schema_designer'),
      'approvalEvidenceHash', approval_hash
    )::text,
    'utf8'
  ), 'sha256'), 'hex');
  return candidate.activation_approval_evidence_hash is distinct from null
     and candidate.activation_approval_evidence_hash = expected_evidence_hash;
exception when others then
  return false;
end;
$body$;

create or replace function platform_private.cms_worker_activate_schema(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  request_content_type_id uuid;
  schema_version_id uuid;
  expected_active_version_id uuid;
  expected_version bigint;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
  candidate platform_private.cms_content_type_versions%rowtype;
  current_active platform_private.cms_content_type_versions%rowtype;
  actor_id uuid;
  reservation platform_private.idempotency_records;
  response jsonb;
  event_id uuid;
  risk_class text;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'migrationPlanId', 'contentTypeId', 'schemaVersionId', 'expectedVersion',
      'expectedActiveVersionId', 'transformKey', 'transformVersion',
      'compilerHash', 'sourceHash', 'targetHash', 'idempotencyKey',
      'switchOnlyOnce'
    ]::text[],
    array[
      'migrationPlanId', 'contentTypeId', 'schemaVersionId', 'expectedVersion',
      'expectedActiveVersionId', 'transformKey', 'transformVersion',
      'compilerHash', 'sourceHash', 'targetHash', 'idempotencyKey',
      'switchOnlyOnce'
    ]::text[]
  );
  if p_request->'switchOnlyOnce' is distinct from 'true'::jsonb then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  request_content_type_id := platform_private.cms_worker_uuid(p_request->>'contentTypeId');
  schema_version_id := platform_private.cms_worker_uuid(p_request->>'schemaVersionId');
  expected_active_version_id := platform_private.cms_worker_uuid(p_request->>'expectedActiveVersionId');
  expected_version := platform_private.cms_worker_positive(p_request->>'expectedVersion');
  -- Read the plan only to discover the candidate owner.  Do not hold the
  -- plan lock yet: human activation takes candidate/graph/active locks first,
  -- so taking plan -> candidate here would deadlock a concurrent switch.
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.content_type_id <> request_content_type_id
     or plan_row.to_version_id <> schema_version_id
     or plan_row.from_version_id <> expected_active_version_id
     or plan_row.version <> expected_version
     or plan_row.state <> 'completed' then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  select * into candidate
    from platform_private.cms_content_type_versions version_row
   where version_row.id = schema_version_id
     and version_row.content_type_id = request_content_type_id
     and version_row.owner_id = plan_row.owner_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  actor_id := coalesce(candidate.created_by, plan_row.created_by, plan_id);
  risk_class := platform_private.cms_activation_risk_class(candidate.workflow_key);
  -- Keep the worker's lock order identical to human activation:
  -- candidate -> dependency graph -> current active -> authority/review /
  -- context -> migration plan.  The initial plan read above is unlocked;
  -- this order prevents a human switch (which reaches the plan after its
  -- source row) from deadlocking against a worker holding plan first.
  perform platform_private.cms_lock_activation_graph(candidate.id);
  if candidate.state = 'active'::platform_private.cms_definition_state then
    -- An active replay has no source row or fresh human decision to acquire;
    -- it still rechecks the immutable dependency graph below.
    null;
  else
    if candidate.state <> 'approved'::platform_private.cms_definition_state then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    select * into current_active
      from platform_private.cms_content_type_versions version_row
     where version_row.id = expected_active_version_id
       and version_row.content_type_id = request_content_type_id
       and version_row.owner_id = plan_row.owner_id
       and version_row.state = 'active'::platform_private.cms_definition_state
     for update;
    if not found then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    if not platform_private.cms_worker_human_approval_valid(candidate.id) then
      raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
    end if;
    if not platform_private.cms_activation_references_valid(candidate.id) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  end if;
  -- The plan lock is acquired only after the same graph/source/authority
  -- locks as the human path.  Revalidate every unlocked snapshot before use.
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.content_type_id <> request_content_type_id
     or plan_row.to_version_id <> schema_version_id
     or plan_row.from_version_id <> expected_active_version_id
     or plan_row.version <> expected_version
     or plan_row.state <> 'completed' then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  perform platform_private.cms_worker_validate_fingerprint(plan_row, p_request);
  if not platform_private.cms_migration_plan_ready(
    plan_id, request_content_type_id, schema_version_id
  ) then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  reservation := platform_private.cms_reserve(
    p_request, actor_id, 'CMS-03A-WORKER-ACTIVATE:' || plan_id::text
  );
  if reservation.state = 'completed'::platform_private.idempotency_state then
    if reservation.response_ref->'safeHeaders' ? 'response' then
      return reservation.response_ref->'safeHeaders'->'response';
    end if;
    raise exception 'INTERNAL_ERROR' using errcode = 'P0001';
  end if;
  if candidate.state = 'active'::platform_private.cms_definition_state then
    -- A replay/status call must not turn an already-active row into a blind
    -- bypass of the immutable artifact/reference boundary.  Human approval
    -- is intentionally not recomputed here: the active row's server-owned
    -- activation evidence is the replay authority, while the first switch
    -- below requires the fresh review path.
    if not platform_private.cms_activation_references_valid(candidate.id) then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    if candidate.activation_workflow_policy_key is null
       or candidate.activation_workflow_policy_version is null
       or candidate.activation_workflow_policy_hash is null
       or candidate.activation_required_decision_count is null
       or candidate.activation_required_capabilities is null
       or candidate.activation_approval_evidence_hash is null then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    select event.id into event_id
      from platform_private.outbox_events event
     where event.event_type = 'cms.schema.activated.v1'
       and event.aggregate_id = candidate.id
     order by event.occurred_at desc, event.id desc
     limit 1;
    response := jsonb_build_object(
      'activated', false,
      'status', 'already_active',
      'migrationPlanId', plan_id,
      'schemaVersionId', candidate.id,
      'eventId', event_id,
      'activationEvidence', jsonb_build_object(
        'key', candidate.activation_workflow_policy_key,
        'version', candidate.activation_workflow_policy_version::text,
        'policyHash', candidate.activation_workflow_policy_hash,
        'riskClass', risk_class,
        'requiredDecisionCount', candidate.activation_required_decision_count,
        'requiredCapabilities', candidate.activation_required_capabilities,
        'approvalEvidenceHash', candidate.activation_approval_evidence_hash
      )
    );
    perform platform_private.cms_complete(reservation.id, candidate.id, 200, response);
    return response;
  end if;
  update platform_private.cms_content_type_versions
     set state = 'superseded', version = version + 1,
         updated_at = pg_catalog.clock_timestamp()
   where id = current_active.id;
  update platform_private.cms_content_type_versions
     set state = 'active',
         version = version + 1,
         updated_at = pg_catalog.clock_timestamp(),
         approved_at = coalesce(approved_at, pg_catalog.clock_timestamp())
   where id = candidate.id;
  update platform_private.cms_content_types
     set state = 'active', version = version + 1,
         updated_at = pg_catalog.clock_timestamp()
     where id = request_content_type_id;
  event_id := platform_private.cms_emit_event(
    'cms.schema.activate.worker', actor_id, plan_row.owner_id,
    'cms_content_type_version', candidate.id, 'CMS_SCHEMA_ACTIVATED',
    'cms.schema.activated.v1', 'cms_content_type_version', candidate.id,
    candidate.version + 1,
    jsonb_build_object(
      'contentTypeId', request_content_type_id,
      'schemaVersionId', candidate.id,
      'migrationPlanId', plan_id,
      'activationEvidence', jsonb_build_object(
        'key', candidate.activation_workflow_policy_key,
        'version', candidate.activation_workflow_policy_version::text,
        'policyHash', candidate.activation_workflow_policy_hash,
        'riskClass', risk_class,
        'requiredDecisionCount', candidate.activation_required_decision_count,
        'requiredCapabilities', candidate.activation_required_capabilities,
        'approvalEvidenceHash', candidate.activation_approval_evidence_hash
      )
    ),
    plan_id
  );
  response := jsonb_build_object(
    'activated', true,
    'status', 'activated',
    'migrationPlanId', plan_id,
    'schemaVersionId', candidate.id,
    'eventId', event_id,
    'activationEvidence', jsonb_build_object(
      'key', candidate.activation_workflow_policy_key,
      'version', candidate.activation_workflow_policy_version::text,
      'policyHash', candidate.activation_workflow_policy_hash,
      'riskClass', risk_class,
      'requiredDecisionCount', candidate.activation_required_decision_count,
      'requiredCapabilities', candidate.activation_required_capabilities,
      'approvalEvidenceHash', candidate.activation_approval_evidence_hash
    )
  );
  perform platform_private.cms_complete(reservation.id, candidate.id, 202, response);
  return response;
end;
$body$;

create or replace function platform_private.cms_reconcile_schema_activation(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  plan_id uuid;
  schema_version_id uuid;
  expected_active_version_id uuid;
  plan_row platform_private.cms_schema_migration_plans%rowtype;
  target_state platform_private.cms_definition_state;
  source_state platform_private.cms_definition_state;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array['migrationPlanId', 'schemaVersionId', 'expectedActiveVersionId', 'idempotencyKey']::text[],
    array['migrationPlanId', 'schemaVersionId', 'expectedActiveVersionId', 'idempotencyKey']::text[]
  );
  plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  schema_version_id := platform_private.cms_worker_uuid(p_request->>'schemaVersionId');
  expected_active_version_id := platform_private.cms_worker_uuid(p_request->>'expectedActiveVersionId');
  select * into plan_row
    from platform_private.cms_schema_migration_plans plan
   where plan.id = plan_id;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if plan_row.to_version_id <> schema_version_id
     or plan_row.from_version_id <> expected_active_version_id then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  select version_row.state into target_state
    from platform_private.cms_content_type_versions version_row
   where version_row.id = schema_version_id
     and version_row.content_type_id = plan_row.content_type_id
     and version_row.owner_id = plan_row.owner_id;
  select version_row.state into source_state
    from platform_private.cms_content_type_versions version_row
   where version_row.id = expected_active_version_id
     and version_row.content_type_id = plan_row.content_type_id
     and version_row.owner_id = plan_row.owner_id;
  if target_state = 'active'::platform_private.cms_definition_state
     and source_state = 'superseded'::platform_private.cms_definition_state then
    return jsonb_build_object('activated', true, 'status', 'already_active');
  end if;
  return jsonb_build_object('activated', false, 'status', 'not_active');
end;
$body$;

-- Event consumption is a renewable, fenced lease rather than a permanent
-- reservation.  Only the event-claim operation may populate these columns;
-- every terminal/retryable transition clears both values together.
alter table platform_private.idempotency_records
  add column claim_token_hash bytea,
  add column claim_lease_until timestamptz,
  add constraint idempotency_claim_token_hash_valid check (
    claim_token_hash is null or octet_length(claim_token_hash) = 32
  ),
  add constraint idempotency_claim_lease_paired check (
    (claim_token_hash is null) = (claim_lease_until is null)
  ),
  add constraint idempotency_claim_lease_operation check (
    operation = 'cms.schema.event.claim'
    or (claim_token_hash is null and claim_lease_until is null)
  ),
  add constraint idempotency_event_claim_state check (
    operation <> 'cms.schema.event.claim'
    or state = 'reserved'::platform_private.idempotency_state
       and claim_token_hash is not null
       and claim_lease_until is not null
       and claim_lease_until > created_at
    or state <> 'reserved'::platform_private.idempotency_state
       and claim_token_hash is null
       and claim_lease_until is null
  );

create or replace function platform_private.cms_claim_schema_migration_event(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  event_id uuid;
  request_event_type text := p_request->>'eventType';
  request_schema_version bigint;
  request_aggregate_type text := p_request->>'aggregateType';
  request_aggregate_id uuid;
  request_aggregate_version bigint;
  migration_plan_id uuid;
  claim_token uuid;
  request_claim_token_hash bytea;
  claim_now timestamptz := pg_catalog.clock_timestamp();
  new_claim_lease_until timestamptz;
  replay boolean;
  event_row platform_private.outbox_events%rowtype;
  claim_record platform_private.idempotency_records;
  request_hash bytea;
  status text;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'eventId', 'eventType', 'schemaVersion', 'aggregateType', 'aggregateId',
      'aggregateVersion', 'migrationPlanId', 'claimToken', 'replay'
    ]::text[],
    array[
      'eventId', 'eventType', 'schemaVersion', 'aggregateType', 'aggregateId',
      'aggregateVersion', 'migrationPlanId', 'claimToken', 'replay'
    ]::text[]
  );
  event_id := platform_private.cms_worker_uuid(p_request->>'eventId');
  request_schema_version := platform_private.cms_worker_positive(
    p_request->>'schemaVersion'
  );
  if request_event_type is null
     or request_event_type !~ '^[a-z][a-z0-9._-]{0,159}$'
     or request_aggregate_type is null
     or request_aggregate_type <> pg_catalog.btrim(request_aggregate_type)
     or pg_catalog.length(request_aggregate_type) not between 1 and 80 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  request_aggregate_id := platform_private.cms_worker_uuid(p_request->>'aggregateId');
  request_aggregate_version := platform_private.cms_worker_positive(p_request->>'aggregateVersion');
  claim_token := platform_private.cms_worker_uuid(p_request->>'claimToken');
  request_claim_token_hash := extensions.digest(
    pg_catalog.convert_to(claim_token::text, 'utf8'), 'sha256'
  );
  new_claim_lease_until := claim_now + interval '2 minutes';
  if p_request->'replay' is distinct from 'true'::jsonb
     and p_request->'replay' is distinct from 'false'::jsonb then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  replay := (p_request->'replay')::boolean;
  if p_request->'migrationPlanId' <> 'null'::jsonb then
    migration_plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  end if;
  select * into event_row
    from platform_private.outbox_events event
   where event.id = event_id
     and event.event_type = request_event_type
     and event.event_type = 'cms.schema.activated.v1'
     and event.schema_version = request_schema_version
     and event.schema_version = 1
     and event.aggregate_type = request_aggregate_type
     and event.aggregate_id = request_aggregate_id
     and event.aggregate_version = request_aggregate_version
   for update;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if event_row.payload->'migrationPlanId' is distinct from p_request->'migrationPlanId' then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from platform_private.outbox_events later_event
     where later_event.aggregate_type = event_row.aggregate_type
       and later_event.aggregate_id = event_row.aggregate_id
       and later_event.aggregate_version > event_row.aggregate_version
  ) then
    return jsonb_build_object('status', 'stale');
  end if;
  request_hash := extensions.digest(
    pg_catalog.convert_to(
      jsonb_build_object(
        'eventId', event_id,
        'eventType', request_event_type,
        'schemaVersion', request_schema_version,
        'aggregateType', request_aggregate_type,
        'aggregateId', request_aggregate_id,
        'aggregateVersion', request_aggregate_version,
        'migrationPlanId', migration_plan_id
      )::text,
      'utf8'
    ),
    'sha256'
  );
  select * into claim_record
    from platform_private.idempotency_records record
   where record.actor_id = event_id
     and record.operation = 'cms.schema.event.claim'
     and record.key_hash = platform_private.cms_key_hash(event_id::text)
   for update;
  if not found then
    insert into platform_private.idempotency_records(
      actor_id, operation, key_hash, request_hash, state, expires_at,
      claim_token_hash, claim_lease_until
    ) values (
      event_id, 'cms.schema.event.claim', platform_private.cms_key_hash(event_id::text),
      request_hash, 'reserved', claim_now + interval '30 days',
      request_claim_token_hash, new_claim_lease_until
    );
    status := case when replay and event_row.dead_lettered_at is not null
      then 'replayable' else 'new' end;
    return jsonb_build_object('status', status);
  end if;
  if claim_record.request_hash <> request_hash then
    raise exception 'IDEMPOTENCY_MISMATCH' using errcode = 'P0001';
  end if;
  if claim_record.state = 'reserved'::platform_private.idempotency_state then
    if claim_record.claim_token_hash = request_claim_token_hash then
      update platform_private.idempotency_records
         set claim_lease_until = new_claim_lease_until
       where id = claim_record.id;
      return jsonb_build_object('status', 'in_progress');
    end if;
    if claim_record.claim_lease_until <= claim_now then
      update platform_private.idempotency_records
         set claim_token_hash = request_claim_token_hash,
             claim_lease_until = new_claim_lease_until
       where id = claim_record.id;
      status := case when replay and event_row.dead_lettered_at is not null
        then 'replayable' else 'new' end;
      return jsonb_build_object('status', status);
    end if;
    return jsonb_build_object('status', 'in_progress');
  end if;
  if claim_record.state = 'failed_retryable'::platform_private.idempotency_state then
    update platform_private.idempotency_records
       set state = 'reserved'::platform_private.idempotency_state,
           response_ref = null,
           claim_token_hash = request_claim_token_hash,
           claim_lease_until = new_claim_lease_until
     where id = claim_record.id;
    status := case when replay and event_row.dead_lettered_at is not null
      then 'replayable' else 'new' end;
    return jsonb_build_object('status', status);
  end if;
  return jsonb_build_object('status', 'duplicate');
end;
$body$;

create or replace function platform_private.cms_release_schema_migration_event(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  event_id uuid;
  request_event_type text := p_request->>'eventType';
  request_schema_version bigint;
  request_aggregate_type text := p_request->>'aggregateType';
  request_aggregate_id uuid;
  request_aggregate_version bigint;
  migration_plan_id uuid;
  claim_token uuid;
  request_claim_token_hash bytea;
  claim_now timestamptz := pg_catalog.clock_timestamp();
  event_row platform_private.outbox_events%rowtype;
  claim_record platform_private.idempotency_records;
  request_hash bytea;
  affected_rows integer;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'eventId', 'eventType', 'schemaVersion', 'aggregateType', 'aggregateId',
      'aggregateVersion', 'migrationPlanId', 'claimToken'
    ]::text[],
    array[
      'eventId', 'eventType', 'schemaVersion', 'aggregateType', 'aggregateId',
      'aggregateVersion', 'migrationPlanId', 'claimToken'
    ]::text[]
  );
  event_id := platform_private.cms_worker_uuid(p_request->>'eventId');
  request_schema_version := platform_private.cms_worker_positive(
    p_request->>'schemaVersion'
  );
  request_aggregate_id := platform_private.cms_worker_uuid(p_request->>'aggregateId');
  request_aggregate_version := platform_private.cms_worker_positive(
    p_request->>'aggregateVersion'
  );
  claim_token := platform_private.cms_worker_uuid(p_request->>'claimToken');
  request_claim_token_hash := extensions.digest(
    pg_catalog.convert_to(claim_token::text, 'utf8'), 'sha256'
  );
  if request_event_type is null
     or request_event_type !~ '^[a-z][a-z0-9._-]{0,159}$'
     or request_aggregate_type is null
     or request_aggregate_type <> pg_catalog.btrim(request_aggregate_type)
     or pg_catalog.length(request_aggregate_type) not between 1 and 80 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_request->'migrationPlanId' <> 'null'::jsonb then
    migration_plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  end if;
  select * into event_row
    from platform_private.outbox_events event
   where event.id = event_id
     and event.event_type = request_event_type
     and event.schema_version = request_schema_version
     and event.aggregate_type = request_aggregate_type
     and event.aggregate_id = request_aggregate_id
     and event.aggregate_version = request_aggregate_version
   for update;
  if not found
     or event_row.payload->'migrationPlanId' is distinct from p_request->'migrationPlanId' then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  request_hash := extensions.digest(
    pg_catalog.convert_to(
      jsonb_build_object(
        'eventId', event_id,
        'eventType', request_event_type,
        'schemaVersion', request_schema_version,
        'aggregateType', request_aggregate_type,
        'aggregateId', request_aggregate_id,
        'aggregateVersion', request_aggregate_version,
        'migrationPlanId', migration_plan_id
      )::text,
      'utf8'
    ),
    'sha256'
  );
  select * into claim_record
    from platform_private.idempotency_records record
   where record.actor_id = event_id
     and record.operation = 'cms.schema.event.claim'
     and record.key_hash = platform_private.cms_key_hash(event_id::text)
   for update;
  if not found
     or claim_record.request_hash <> request_hash
     or claim_record.state <> 'reserved'::platform_private.idempotency_state
     or claim_record.claim_token_hash <> request_claim_token_hash
     or claim_record.claim_lease_until <= claim_now then
    return jsonb_build_object(
      'released', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
    );
  end if;
  update platform_private.idempotency_records
     set state = 'failed_retryable'::platform_private.idempotency_state,
         response_ref = jsonb_build_object(
           'status', 503,
           'safeHeaders', jsonb_build_object(
             'response', jsonb_build_object(
               'eventId', event_id, 'outcome', 'released', 'retryable', true
             )
           )
         ),
         claim_token_hash = null,
         claim_lease_until = null
   where id = claim_record.id
     and state = 'reserved'::platform_private.idempotency_state
     and claim_token_hash = request_claim_token_hash
     and claim_lease_until > claim_now;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    return jsonb_build_object(
      'released', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
    );
  end if;
  return jsonb_build_object('released', true);
end;
$body$;

create or replace function platform_private.cms_acknowledge_schema_migration_event(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  event_id uuid;
  request_event_type text := p_request->>'eventType';
  request_schema_version bigint;
  request_aggregate_type text := p_request->>'aggregateType';
  request_aggregate_id uuid;
  request_aggregate_version bigint;
  migration_plan_id uuid;
  claim_token uuid;
  request_claim_token_hash bytea;
  claim_now timestamptz := pg_catalog.clock_timestamp();
  outcome text := p_request->>'outcome';
  event_row platform_private.outbox_events%rowtype;
  claim_record platform_private.idempotency_records;
  request_hash bytea;
  affected_rows integer;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array[
      'eventId', 'eventType', 'schemaVersion', 'aggregateType', 'aggregateId',
      'aggregateVersion', 'migrationPlanId', 'claimToken', 'outcome'
    ]::text[],
    array[
      'eventId', 'eventType', 'schemaVersion', 'aggregateType', 'aggregateId',
      'aggregateVersion', 'migrationPlanId', 'claimToken', 'outcome'
    ]::text[]
  );
  event_id := platform_private.cms_worker_uuid(p_request->>'eventId');
  request_schema_version := platform_private.cms_worker_positive(
    p_request->>'schemaVersion'
  );
  request_aggregate_id := platform_private.cms_worker_uuid(p_request->>'aggregateId');
  request_aggregate_version := platform_private.cms_worker_positive(
    p_request->>'aggregateVersion'
  );
  claim_token := platform_private.cms_worker_uuid(p_request->>'claimToken');
  request_claim_token_hash := extensions.digest(
    pg_catalog.convert_to(claim_token::text, 'utf8'), 'sha256'
  );
  if request_event_type is null
     or request_event_type !~ '^[a-z][a-z0-9._-]{0,159}$'
     or request_aggregate_type is null
     or request_aggregate_type <> pg_catalog.btrim(request_aggregate_type)
     or pg_catalog.length(request_aggregate_type) not between 1 and 80 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_request->'migrationPlanId' <> 'null'::jsonb then
    migration_plan_id := platform_private.cms_worker_uuid(p_request->>'migrationPlanId');
  end if;
  if outcome not in ('ignored', 'success', 'failure') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into event_row
    from platform_private.outbox_events event
   where event.id = event_id
     and event.event_type = request_event_type
     and event.schema_version = request_schema_version
     and event.aggregate_type = request_aggregate_type
     and event.aggregate_id = request_aggregate_id
     and event.aggregate_version = request_aggregate_version
   for update;
  if not found
     or event_row.payload->'migrationPlanId' is distinct from p_request->'migrationPlanId' then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  request_hash := extensions.digest(
    pg_catalog.convert_to(
      jsonb_build_object(
        'eventId', event_id,
        'eventType', request_event_type,
        'schemaVersion', request_schema_version,
        'aggregateType', request_aggregate_type,
        'aggregateId', request_aggregate_id,
        'aggregateVersion', request_aggregate_version,
        'migrationPlanId', migration_plan_id
      )::text,
      'utf8'
    ),
    'sha256'
  );
  select * into claim_record
    from platform_private.idempotency_records record
   where record.actor_id = event_id
     and record.operation = 'cms.schema.event.claim'
     and record.key_hash = platform_private.cms_key_hash(event_id::text)
   for update;
  if not found or claim_record.request_hash <> request_hash then
    return jsonb_build_object(
      'accepted', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
    );
  end if;
  if claim_record.state = 'completed'::platform_private.idempotency_state then
    return jsonb_build_object('accepted', true);
  end if;
  if claim_record.state <> 'reserved'::platform_private.idempotency_state
     or claim_record.claim_token_hash <> request_claim_token_hash
     or claim_record.claim_lease_until <= claim_now then
    return jsonb_build_object(
      'accepted', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
    );
  end if;
  update platform_private.idempotency_records
     set state = 'completed'::platform_private.idempotency_state,
         response_ref = jsonb_build_object(
           'status', 200,
           'safeHeaders', jsonb_build_object(
             'response', jsonb_build_object(
               'eventId', event_id, 'outcome', outcome, 'acknowledged', true
             )
           )
         ),
         claim_token_hash = null,
         claim_lease_until = null
   where id = claim_record.id
     and state = 'reserved'::platform_private.idempotency_state
     and claim_token_hash = request_claim_token_hash
     and claim_lease_until > claim_now;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    return jsonb_build_object(
      'accepted', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
    );
  end if;
  return jsonb_build_object('accepted', true);
end;
$body$;

create or replace function platform_private.cms_dead_letter_schema_migration_event(
  p_request jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $body$
declare
  event_id uuid;
  event_type text := p_request->>'eventType';
  schema_version bigint;
  aggregate_type text := p_request->>'aggregateType';
  aggregate_id uuid;
  aggregate_version bigint;
  migration_plan_id uuid;
  claim_token uuid;
  request_claim_token_hash bytea;
  claim_now timestamptz := pg_catalog.clock_timestamp();
  request_hash bytea;
  reason_code text := p_request->>'reasonCode';
  claim_record platform_private.idempotency_records;
  event_row platform_private.outbox_events%rowtype;
  event_exists boolean;
  affected_rows integer;
begin
  perform platform_private.cms_worker_require_request(
    p_request,
    array['eventId', 'claimToken', 'reasonCode']::text[],
    array[
      'eventId', 'eventType', 'schemaVersion', 'aggregateType', 'aggregateId',
      'aggregateVersion', 'migrationPlanId', 'claimToken', 'reasonCode'
    ]::text[]
  );
  if reason_code is null or reason_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  claim_token := platform_private.cms_worker_uuid(p_request->>'claimToken');
  request_claim_token_hash := extensions.digest(
    pg_catalog.convert_to(claim_token::text, 'utf8'), 'sha256'
  );
  if p_request->'eventId' = 'null'::jsonb then
    event_id := extensions.gen_random_uuid();
  else
    event_id := platform_private.cms_worker_uuid(p_request->>'eventId');
  end if;
  -- Serialize even the synthetic/no-row path so two deliveries cannot both
  -- create ownership for the same caller-supplied event ID.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('cms.schema.event:' || event_id::text, 0)
  );
  select * into event_row
    from platform_private.outbox_events event
   where event.id = event_id
   for update;
  event_exists := found;
  if event_exists then
    -- An existing event is immutable identity.  Parse every canonical value
    -- with CONFLICT semantics and compare it before touching the row or its
    -- claim.  aggregate_type is intentionally advisory: older activation
    -- fixtures use different values, while the remaining identity fields are
    -- stable and sufficient to bind the dead-letter decision.
    if not p_request ? 'eventType'
       or p_request->'eventType' = 'null'::jsonb
       or p_request->>'eventType' !~ '^[a-z][a-z0-9._-]{0,159}$' then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    event_type := p_request->>'eventType';
    if not p_request ? 'schemaVersion'
       or p_request->'schemaVersion' = 'null'::jsonb then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    schema_version := platform_private.cms_worker_positive(
      p_request->>'schemaVersion', 'CONFLICT'
    );
    if schema_version > 100 then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    if not p_request ? 'aggregateId'
       or p_request->'aggregateId' = 'null'::jsonb then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    aggregate_id := platform_private.cms_worker_uuid(
      p_request->>'aggregateId', 'CONFLICT'
    );
    if not p_request ? 'aggregateVersion'
       or p_request->'aggregateVersion' = 'null'::jsonb then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    aggregate_version := platform_private.cms_worker_positive(
      p_request->>'aggregateVersion', 'CONFLICT'
    );
    if not p_request ? 'migrationPlanId' then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    if p_request->'migrationPlanId' <> 'null'::jsonb then
      migration_plan_id := platform_private.cms_worker_uuid(
        p_request->>'migrationPlanId', 'CONFLICT'
      );
    end if;
    if event_row.event_type is distinct from event_type
       or event_row.schema_version is distinct from schema_version
       or event_row.aggregate_id is distinct from aggregate_id
       or event_row.aggregate_version is distinct from aggregate_version
       or (migration_plan_id is null
          and event_row.payload->'migrationPlanId' is distinct from 'null'::jsonb)
       or (migration_plan_id is not null
          and event_row.payload->'migrationPlanId' is distinct from p_request->'migrationPlanId') then
      raise exception 'CONFLICT' using errcode = 'P0001';
    end if;
    aggregate_type := event_row.aggregate_type;
  else
    if event_type is null or event_type !~ '^[a-z][a-z0-9._-]{0,159}$' then
      event_type := 'cms.schema.invalid.v1';
    end if;
    if aggregate_type is null
       or aggregate_type !~ '^[A-Za-z][A-Za-z0-9_.:-]{0,79}$' then
      aggregate_type := 'cms.schema.migration';
    end if;
    if p_request->'schemaVersion' is null
       or p_request->'schemaVersion' = 'null'::jsonb then
      schema_version := 1;
    else
      schema_version := platform_private.cms_worker_positive(p_request->>'schemaVersion');
      if schema_version > 100 then
        raise exception 'INVALID_REQUEST' using errcode = 'P0001';
      end if;
    end if;
    aggregate_id := event_id;
    aggregate_version := 1;
  end if;
  request_hash := extensions.digest(
    pg_catalog.convert_to(
      jsonb_build_object(
        'eventId', event_id,
        'eventType', event_type,
        'schemaVersion', schema_version,
        'aggregateType', aggregate_type,
        'aggregateId', aggregate_id,
        'aggregateVersion', aggregate_version,
        'migrationPlanId', migration_plan_id
      )::text,
      'utf8'
    ),
    'sha256'
  );
  select * into claim_record
    from platform_private.idempotency_records record
   where record.actor_id = event_id
     and record.operation = 'cms.schema.event.claim'
     and record.key_hash = platform_private.cms_key_hash(event_id::text)
   for update;
  if found then
    if claim_record.request_hash <> request_hash then
      return jsonb_build_object(
        'accepted', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
      );
    end if;
    if claim_record.state = 'completed'::platform_private.idempotency_state then
      if event_exists and event_row.dead_lettered_at is not null then
        return jsonb_build_object('accepted', true);
      end if;
      return jsonb_build_object(
        'accepted', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
      );
    end if;
    if claim_record.state = 'failed_retryable'::platform_private.idempotency_state
       and event_exists and event_row.dead_lettered_at is not null then
      return jsonb_build_object('accepted', true);
    end if;
    if claim_record.state = 'reserved'::platform_private.idempotency_state then
      if claim_record.claim_token_hash <> request_claim_token_hash
         or claim_record.claim_lease_until <= claim_now then
        return jsonb_build_object(
          'accepted', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
        );
      end if;
    elsif claim_record.state = 'failed_retryable'::platform_private.idempotency_state then
      update platform_private.idempotency_records
         set state = 'reserved'::platform_private.idempotency_state,
             response_ref = null,
             claim_token_hash = request_claim_token_hash,
             claim_lease_until = claim_now + interval '2 minutes'
       where id = claim_record.id;
    else
      return jsonb_build_object(
        'accepted', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
      );
    end if;
  else
    insert into platform_private.idempotency_records(
      actor_id, operation, key_hash, request_hash, state, expires_at,
      claim_token_hash, claim_lease_until
    ) values (
      event_id, 'cms.schema.event.claim', platform_private.cms_key_hash(event_id::text),
      request_hash, 'reserved', claim_now + interval '30 days',
      request_claim_token_hash, claim_now + interval '2 minutes'
    )
    returning * into claim_record;
  end if;
  -- Consume ownership before touching the event.  Any later SQL failure rolls
  -- the whole transaction back; a lost fence therefore cannot partially
  -- dead-letter an event.
  update platform_private.idempotency_records
     set state = 'failed_retryable'::platform_private.idempotency_state,
         response_ref = jsonb_build_object(
           'status', 500,
           'safeHeaders', jsonb_build_object(
             'response', jsonb_build_object(
               'eventId', event_id, 'outcome', 'failure', 'accepted', true
             )
           )
         ),
         claim_token_hash = null,
         claim_lease_until = null
   where id = claim_record.id
     and state = 'reserved'::platform_private.idempotency_state
     and claim_token_hash = request_claim_token_hash
     and claim_lease_until > claim_now;
  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    return jsonb_build_object(
      'accepted', false, 'code', 'EVENT_CLAIM_LOST', 'retryable', true
    );
  end if;
  if event_exists then
    update platform_private.outbox_events
       set dispatched_at = coalesce(dispatched_at, pg_catalog.clock_timestamp()),
           dispatch_lease_token = null,
           dispatch_lease_until = null,
           dead_lettered_at = coalesce(dead_lettered_at, pg_catalog.clock_timestamp()),
           dead_letter_reason = left(reason_code, 160),
           last_dispatch_error_code = reason_code
     where id = event_id;
  else
    insert into platform_private.outbox_events(
      id, event_type, schema_version, aggregate_type, aggregate_id,
      aggregate_version, correlation_id, payload, occurred_at, dispatched_at,
      dead_lettered_at, dead_letter_reason, last_dispatch_error_code
    ) values (
      event_id, event_type, schema_version::integer, aggregate_type, event_id,
      1, event_id,
      jsonb_build_object('eventType', event_type, 'schemaVersion', schema_version,
        'reasonCode', reason_code),
      claim_now, claim_now, claim_now, left(reason_code, 160), reason_code
    );
  end if;
  return jsonb_build_object('accepted', true);
end;
$body$;

create schema if not exists platform_api;

create or replace function platform_api.cms_create_type_draft(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_create_type_draft(p_request)
$body$;
create or replace function platform_api.cms_add_field_definition(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_add_field_definition(p_request)
$body$;
create or replace function platform_api.cms_bind_relation(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_bind_relation(p_request)
$body$;
create or replace function platform_api.cms_activate_schema(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_activate_schema(p_request)
$body$;
create or replace function platform_api.cms_activate_schema_migration(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_worker_activate_schema(p_request)
$body$;
create or replace function platform_api.cms_register_block(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_register_block(p_request)
$body$;
create or replace function platform_api.cms_advance_block_lifecycle(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_advance_block_lifecycle(p_request)
$body$;
create or replace function platform_api.cms_list_content_types(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_list_content_types(p_request)
$body$;
create or replace function platform_api.cms_get_content_type_version(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_get_content_type_version(p_request)
$body$;

create or replace function platform_api.cms_get_schema_migration_plan(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_get_schema_migration_plan(p_request)
$body$;
create or replace function platform_api.cms_claim_schema_migration_lease(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_claim_schema_migration_lease(p_request)
$body$;
create or replace function platform_api.cms_heartbeat_schema_migration_lease(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_heartbeat_schema_migration_lease(p_request)
$body$;
create or replace function platform_api.cms_process_schema_migration_dry_run_batch(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_process_schema_migration_dry_run_batch(p_request)
$body$;
create or replace function platform_api.cms_finalize_schema_migration_dry_run(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_finalize_schema_migration_dry_run(p_request)
$body$;
create or replace function platform_api.cms_process_schema_migration_batch(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_process_schema_migration_batch(p_request, false)
$body$;
create or replace function platform_api.cms_begin_schema_migration_verification(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_begin_schema_migration_verification(p_request)
$body$;
create or replace function platform_api.cms_verify_schema_migration(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_verify_schema_migration(p_request)
$body$;
create or replace function platform_api.cms_complete_schema_migration(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_complete_schema_migration(p_request)
$body$;
create or replace function platform_api.cms_reconcile_schema_activation(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_reconcile_schema_activation(p_request)
$body$;
create or replace function platform_api.cms_rollback_schema_migration(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_rollback_schema_migration(p_request)
$body$;
create or replace function platform_api.cms_claim_schema_migration_event(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_claim_schema_migration_event(p_request)
$body$;
create or replace function platform_api.cms_release_schema_migration_event(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_release_schema_migration_event(p_request)
$body$;
create or replace function platform_api.cms_acknowledge_schema_migration_event(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_acknowledge_schema_migration_event(p_request)
$body$;
create or replace function platform_api.cms_dead_letter_schema_migration_event(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cms_dead_letter_schema_migration_event(p_request)
$body$;

revoke all on function platform_api.cms_create_type_draft(jsonb), platform_api.cms_add_field_definition(jsonb), platform_api.cms_bind_relation(jsonb), platform_api.cms_activate_schema(jsonb), platform_api.cms_register_block(jsonb), platform_api.cms_advance_block_lifecycle(jsonb), platform_api.cms_list_content_types(jsonb), platform_api.cms_get_content_type_version(jsonb) from public, anon;
grant usage on schema platform_api to authenticated, service_role;
grant execute on function platform_api.cms_create_type_draft(jsonb), platform_api.cms_add_field_definition(jsonb), platform_api.cms_bind_relation(jsonb), platform_api.cms_activate_schema(jsonb), platform_api.cms_register_block(jsonb), platform_api.cms_advance_block_lifecycle(jsonb), platform_api.cms_list_content_types(jsonb), platform_api.cms_get_content_type_version(jsonb) to authenticated, service_role;
revoke execute on function platform_api.cms_register_block(jsonb), platform_api.cms_advance_block_lifecycle(jsonb) from authenticated;

revoke all on function
  platform_api.cms_get_schema_migration_plan(jsonb),
  platform_api.cms_claim_schema_migration_lease(jsonb),
  platform_api.cms_heartbeat_schema_migration_lease(jsonb),
  platform_api.cms_process_schema_migration_dry_run_batch(jsonb),
  platform_api.cms_finalize_schema_migration_dry_run(jsonb),
  platform_api.cms_process_schema_migration_batch(jsonb),
  platform_api.cms_begin_schema_migration_verification(jsonb),
  platform_api.cms_verify_schema_migration(jsonb),
  platform_api.cms_complete_schema_migration(jsonb),
  platform_api.cms_activate_schema_migration(jsonb),
  platform_api.cms_reconcile_schema_activation(jsonb),
  platform_api.cms_rollback_schema_migration(jsonb),
  platform_api.cms_claim_schema_migration_event(jsonb),
  platform_api.cms_release_schema_migration_event(jsonb),
  platform_api.cms_acknowledge_schema_migration_event(jsonb),
  platform_api.cms_dead_letter_schema_migration_event(jsonb)
from public, anon, authenticated;
grant execute on function
  platform_api.cms_get_schema_migration_plan(jsonb),
  platform_api.cms_claim_schema_migration_lease(jsonb),
  platform_api.cms_heartbeat_schema_migration_lease(jsonb),
  platform_api.cms_process_schema_migration_dry_run_batch(jsonb),
  platform_api.cms_finalize_schema_migration_dry_run(jsonb),
  platform_api.cms_process_schema_migration_batch(jsonb),
  platform_api.cms_begin_schema_migration_verification(jsonb),
  platform_api.cms_verify_schema_migration(jsonb),
  platform_api.cms_complete_schema_migration(jsonb),
  platform_api.cms_activate_schema_migration(jsonb),
  platform_api.cms_reconcile_schema_activation(jsonb),
  platform_api.cms_rollback_schema_migration(jsonb),
  platform_api.cms_claim_schema_migration_event(jsonb),
  platform_api.cms_release_schema_migration_event(jsonb),
  platform_api.cms_acknowledge_schema_migration_event(jsonb),
  platform_api.cms_dead_letter_schema_migration_event(jsonb)
to service_role;

-- Keep a literal service-role grant for every worker operation.  The grouped
-- grant above is the compact policy; these statements make the public worker
-- boundary auditable by catalog scanners and future migration reviewers.
grant execute on function platform_api.cms_get_schema_migration_plan(jsonb) to service_role;
grant execute on function platform_api.cms_claim_schema_migration_lease(jsonb) to service_role;
grant execute on function platform_api.cms_heartbeat_schema_migration_lease(jsonb) to service_role;
grant execute on function platform_api.cms_process_schema_migration_dry_run_batch(jsonb) to service_role;
grant execute on function platform_api.cms_finalize_schema_migration_dry_run(jsonb) to service_role;
grant execute on function platform_api.cms_process_schema_migration_batch(jsonb) to service_role;
grant execute on function platform_api.cms_begin_schema_migration_verification(jsonb) to service_role;
grant execute on function platform_api.cms_verify_schema_migration(jsonb) to service_role;
grant execute on function platform_api.cms_complete_schema_migration(jsonb) to service_role;
grant execute on function platform_api.cms_activate_schema_migration(jsonb) to service_role;
grant execute on function platform_api.cms_reconcile_schema_activation(jsonb) to service_role;
grant execute on function platform_api.cms_rollback_schema_migration(jsonb) to service_role;
grant execute on function platform_api.cms_claim_schema_migration_event(jsonb) to service_role;
grant execute on function platform_api.cms_release_schema_migration_event(jsonb) to service_role;
grant execute on function platform_api.cms_acknowledge_schema_migration_event(jsonb) to service_role;
grant execute on function platform_api.cms_dead_letter_schema_migration_event(jsonb) to service_role;

revoke all on function platform_private.cms_create_type_draft(jsonb), platform_private.cms_add_field_definition(jsonb), platform_private.cms_bind_relation(jsonb), platform_private.cms_activate_schema(jsonb), platform_private.cms_register_block(jsonb), platform_private.cms_advance_block_lifecycle(jsonb), platform_private.cms_list_content_types(jsonb), platform_private.cms_get_content_type_version(jsonb) from public, anon, authenticated, service_role;
grant execute on function platform_private.cms_create_type_draft(jsonb), platform_private.cms_add_field_definition(jsonb), platform_private.cms_bind_relation(jsonb), platform_private.cms_activate_schema(jsonb), platform_private.cms_register_block(jsonb), platform_private.cms_advance_block_lifecycle(jsonb), platform_private.cms_list_content_types(jsonb), platform_private.cms_get_content_type_version(jsonb) to service_role;

do $body$
declare
  function_oid oid;
begin
  for function_oid in
    select p.oid
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_private'
      and p.proname like 'cms_%'
  loop
    execute format(
      'revoke all on function %s from public, anon, authenticated, service_role',
      function_oid::regprocedure
    );
  end loop;
end;
$body$;

commit;
