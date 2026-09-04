begin;

create or replace function platform_private.cfg_emit_effects(
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
language plpgsql security definer set search_path = ''
as $body$
declare
  event_id uuid := extensions.gen_random_uuid();
begin
  insert into audit_private.audit_events(
    action, actor_id, acting_party_id, target_type, target_id,
    decision, reason_code, correlation_id
  ) values (
    p_action, p_actor_id, p_acting_party_id, p_target_type, p_target_id,
    'allowed'::platform_private.audit_decision, p_reason_code, p_correlation_id
  );
  insert into platform_private.outbox_events(
    id, event_type, schema_version, aggregate_type, aggregate_id,
    aggregate_version, correlation_id, payload
  ) values (
    event_id, p_event_type, 1, p_aggregate_type, p_aggregate_id,
    p_aggregate_version, p_correlation_id, p_payload
  );
  return event_id;
end;
$body$;

-- Slice 07 command authority.  These RPCs accept the already-normalized
-- Worker request envelope, re-check every security and version invariant in
-- the transaction, and return only the named public projection.

create or replace function platform_private.cfg_parse_uuid(
  p_value text, p_code text default 'INVALID_REQUEST'
)
returns uuid
language plpgsql immutable set search_path = ''
as $body$
begin
  if not platform_private.cfg_valid_uuid(p_value) then
    raise exception '%', p_code using errcode = 'P0001';
  end if;
  return p_value::uuid;
end;
$body$;

create or replace function platform_private.cfg_parse_version(
  p_value text, p_code text default 'INVALID_REQUEST'
)
returns bigint
language plpgsql immutable set search_path = ''
as $body$
declare
  parsed bigint;
begin
  if p_value is null or p_value !~ '^[1-9][0-9]{0,17}$' then
    raise exception '%', p_code using errcode = 'P0001';
  end if;
  begin parsed := p_value::bigint; exception when others then
    raise exception '%', p_code using errcode = 'P0001';
  end;
  if parsed < 1 then raise exception '%', p_code using errcode = 'P0001'; end if;
  return parsed;
end;
$body$;

create or replace function platform_private.cfg_request_reserve(
  p_request jsonb, p_actor_id uuid, p_operation text
)
returns platform_private.idempotency_records
language plpgsql security definer set search_path = ''
as $body$
declare
  key_value text := nullif(p_request->>'idempotencyKey', '');
begin
  if p_actor_id is null or key_value is null
     or pg_catalog.length(key_value) < 8
     or pg_catalog.length(key_value) > 256
     or key_value ~ '[[:cntrl:]]'
     or p_operation is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  return platform_private.identity_idempotency_reserve(
    p_actor_id,
    p_operation,
    platform_private.cfg_hash_text(key_value),
    platform_private.cfg_hash_text(p_request::text)
  );
end;
$body$;

create or replace function platform_private.cfg_request_complete(
  p_id uuid, p_status integer, p_response jsonb
)
returns void
language plpgsql security definer set search_path = ''
as $body$
begin
  update platform_private.idempotency_records
     set state = 'completed'::platform_private.idempotency_state,
         response_ref = pg_catalog.jsonb_build_object(
           'status', p_status,
           'resourceRef', coalesce(p_response->>'definitionId', p_response->>'reviewId', p_response->>'resultingValueVersionId'),
           'responseBody', p_response
         )
   where id = p_id;
  if not found then raise exception 'INTERNAL_ERROR' using errcode = 'P0001'; end if;
end;
$body$;

create or replace function platform_private.cfg_request_actor(
  p_request jsonb, p_require_context boolean default true
)
returns table(actor_id uuid, acting_party_id uuid)
language plpgsql security definer set search_path = ''
as $body$
declare
  requested_party_id uuid;
begin
  actor_id := platform_private.cfg_actor(p_request);
  if p_require_context then
    requested_party_id := platform_private.cfg_acting_party(p_request, actor_id);
    if not exists (select 1 from platform_private.party where id = requested_party_id) then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
    if not exists (
      select 1 from platform_private.person_party pp
       where pp.auth_user_id = actor_id
         and pp.party_id = requested_party_id
         and pp.account_state in ('claimed'::platform_private.person_account_state,
                                  'active'::platform_private.person_account_state)
    ) and not exists (
      select 1 from platform_private.acting_context_binding binding
       where binding.person_id = platform_private.identity_actor_person(actor_id)
         and binding.acting_party_id = requested_party_id
         and binding.state = 'active'::platform_private.context_binding_state
         and binding.expires_at > pg_catalog.clock_timestamp()
    ) then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
  else
    requested_party_id := actor_id;
  end if;
  acting_party_id := requested_party_id;
  return next;
end;
$body$;

create or replace function platform_private.cfg_release_request_actor(
  p_request jsonb
)
returns table(actor_id uuid, acting_party_id uuid)
language plpgsql security definer set search_path = ''
as $body$
begin
  actor_id := platform_private.cfg_release_actor(p_request);
  -- A release principal is an auth identity, not an acting browser context.
  -- The audit party is still required by BE00, so use its canonical person
  -- party when one exists and retain the principal as the safe fallback.
  select coalesce(pp.party_id, actor_id) into acting_party_id
    from platform_private.person_party pp
   where pp.auth_user_id = actor_id
   order by pp.party_id
   limit 1;
  acting_party_id := coalesce(acting_party_id, actor_id);
  return next;
end;
$body$;

create or replace function platform_private.cfg_scope_is_valid(
  p_scope_type text, p_scope_id text, p_environment text
)
returns boolean
language sql immutable set search_path = ''
as $body$
  select p_scope_type in ('platform','environment','party','site','route','feature','user')
     and (
       (p_scope_type = 'platform' and p_scope_id is null and p_environment is null)
       or (p_scope_type = 'environment' and p_scope_id is null and p_environment is not null
           and pg_catalog.length(p_environment) between 1 and 64)
       or (p_scope_type in ('party','site','user') and platform_private.cfg_valid_uuid(p_scope_id)
           and (p_environment is null or pg_catalog.length(p_environment) between 1 and 64))
       or (p_scope_type in ('route','feature') and p_scope_id is null
           and (p_environment is null or pg_catalog.length(p_environment) between 1 and 64))
     );
$body$;

create or replace function platform_private.cfg_definition_response(
  p_definition platform_private.cfg_setting_definition_versions,
  p_definition_id uuid,
  p_synchronized boolean default true
)
returns jsonb
language sql stable security definer set search_path = ''
as $body$
  select pg_catalog.jsonb_build_object(
    'definitionId', p_definition_id,
    'definitionVersionId', p_definition.id,
    'key', p_definition.key,
    'version', p_definition.version_no::text,
    'valueKind', p_definition.value_kind,
    'allowedScopes', p_definition.allowed_scopes,
    'precedence', p_definition.precedence,
    'mergeMode', p_definition.merge_mode,
    'riskClass', p_definition.risk_class,
    'lifecycle', p_definition.lifecycle,
    'schemaHash', platform_private.cfg_hash_json(p_definition.schema),
    'contractRelease', p_definition.contract_release,
    'synchronized', p_synchronized,
    'createdAt', p_definition.created_at
  );
$body$;

create or replace function platform_private.cfg_register_definition(
  p_request jsonb
)
returns jsonb
language plpgsql security definer set search_path = ''
as $body$
declare
  actor record;
  reservation platform_private.idempotency_records;
  definition platform_private.cfg_setting_definition_versions%rowtype;
  definition_id uuid := extensions.gen_random_uuid();
  definition_version_id uuid := extensions.gen_random_uuid();
  response jsonb;
  policy jsonb;
  consumer text;
begin
  perform platform_private.cfg_require_keys(
    p_request,
    array['key','valueKind','schema','ownerCapability','allowedScopes','precedence',
      'mergeMode','defaultSource','defaultValue','riskClass','approverPolicy',
      'consumerKeys','contractRelease','sensitivity','deprecationAt','reason',
      'idempotencyKey','context']::text[],
    array['key','valueKind','schema','ownerCapability','allowedScopes','precedence',
      'mergeMode','defaultSource','riskClass','approverPolicy','consumerKeys',
      'contractRelease','sensitivity','reason','idempotencyKey','context']::text[]
  );
  if pg_catalog.jsonb_typeof(p_request->'context') <> 'object'
     or not platform_private.cfg_valid_key(p_request->>'key')
     or platform_private.cfg_protected_key(p_request->>'key')
     or p_request->>'ownerCapability' !~ '^[a-z][a-z0-9_.-]{1,95}$'
     or p_request->>'contractRelease' !~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
     or p_request->>'valueKind' not in ('boolean','integer','decimal','short_text','enum',
       'duration','timestamp','json_object','string_list','percentage')
     or p_request->>'mergeMode' not in ('replace','append_unique','object_merge_allowlist')
     or p_request->>'defaultSource' not in ('contract','literal','required')
     or p_request->>'riskClass' not in ('low','medium','high','emergency')
     or p_request->>'sensitivity' not in ('public','internal','restricted')
     or pg_catalog.jsonb_typeof(p_request->'schema') <> 'object'
     or not platform_private.cfg_json_bounded(p_request->'schema', 4, 65536)
     or pg_catalog.jsonb_typeof(p_request->'allowedScopes') <> 'array'
     or pg_catalog.jsonb_array_length(p_request->'allowedScopes') not between 1 and 7
     or pg_catalog.jsonb_typeof(p_request->'precedence') <> 'array'
     or pg_catalog.jsonb_array_length(p_request->'precedence') not between 1 and 7
     or pg_catalog.jsonb_typeof(p_request->'consumerKeys') <> 'array'
     or pg_catalog.jsonb_array_length(p_request->'consumerKeys') > 64
     or pg_catalog.jsonb_typeof(p_request->'approverPolicy') <> 'object' then
    raise exception 'INVALID_DEFINITION' using errcode = 'P0001';
  end if;
  if p_request->>'defaultSource' = 'literal'
     and (not (p_request ? 'defaultValue')
       or not platform_private.cfg_validate_value(
         p_request->>'valueKind', p_request->'schema', p_request->'defaultValue')) then
    raise exception 'INVALID_DEFINITION' using errcode = 'P0001';
  end if;
  if p_request->>'defaultSource' <> 'literal' and p_request ? 'defaultValue' then
    raise exception 'INVALID_DEFINITION' using errcode = 'P0001';
  end if;
  if p_request->>'sensitivity' = 'restricted'
     and (p_request->>'defaultSource' = 'literal' or p_request ? 'defaultValue') then
    raise exception 'PROTECTED_SETTING' using errcode = 'P0001';
  end if;
  if not platform_private.cfg_json_bounded(p_request->'approverPolicy', 4, 65536)
     or not (p_request->'approverPolicy' ?& array['minimumDistinct','requiresMfa','requiresCanary','notifyCapabilities']::text[])
     or (p_request->'approverPolicy'->>'minimumDistinct') !~ '^[1-5]$'
     or pg_catalog.jsonb_typeof(p_request->'approverPolicy'->'requiresMfa') <> 'boolean'
     or pg_catalog.jsonb_typeof(p_request->'approverPolicy'->'requiresCanary') <> 'boolean'
     or pg_catalog.jsonb_typeof(p_request->'approverPolicy'->'notifyCapabilities') <> 'array'
     or pg_catalog.jsonb_array_length(p_request->'approverPolicy'->'notifyCapabilities') > 16 then
    raise exception 'INVALID_DEFINITION' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from jsonb_array_elements_text(p_request->'allowedScopes') value
     where value not in ('platform','environment','party','site','route','feature','user')
  ) or exists (
    select 1 from jsonb_array_elements_text(p_request->'precedence') value
     where value not in ('platform','environment','party','site','route','feature','user')
        or not (p_request->'allowedScopes' ? value)
  ) or not platform_private.cfg_array_distinct(array(
      select value from jsonb_array_elements_text(p_request->'allowedScopes') value))
    or not platform_private.cfg_array_distinct(array(
      select value from jsonb_array_elements_text(p_request->'precedence') value)) then
    raise exception 'INVALID_DEFINITION' using errcode = 'P0001';
  end if;
  for consumer in select value from jsonb_array_elements_text(p_request->'consumerKeys') value loop
    if not platform_private.cfg_valid_key(consumer) then
      raise exception 'INVALID_DEFINITION' using errcode = 'P0001';
    end if;
  end loop;
  if not platform_private.cfg_array_distinct(array(
      select value from jsonb_array_elements_text(p_request->'consumerKeys') value)) then
    raise exception 'INVALID_DEFINITION' using errcode = 'P0001';
  end if;

  select * into actor from platform_private.cfg_release_request_actor(p_request);
  reservation := platform_private.cfg_request_reserve(p_request, actor.actor_id, 'config.definition.register');
  if reservation.state = 'completed'::platform_private.idempotency_state then
    return coalesce(reservation.response_ref->'responseBody', reservation.response_ref);
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_request->>'key', 0));
  perform 1
    from platform_private.cfg_setting_definition_versions
   where key = p_request->>'key';
  if found then raise exception 'DEFINITION_KEY_REUSED' using errcode = 'P0001'; end if;
  policy := p_request->'approverPolicy';
  insert into platform_private.cfg_setting_definition_versions(
    id, definition_id, key, version_no, value_kind, schema, owner_capability,
    allowed_scopes, precedence, merge_mode, default_source, default_value,
    risk_class, approver_policy, consumer_keys, sensitivity, contract_release,
    lifecycle, hash, created_by, created_at, deprecated_at
  ) values (
    definition_version_id, definition_id, p_request->>'key', 1,
    p_request->>'valueKind', p_request->'schema', p_request->>'ownerCapability',
    array(select value from jsonb_array_elements_text(p_request->'allowedScopes') value),
    array(select value from jsonb_array_elements_text(p_request->'precedence') value),
    p_request->>'mergeMode', p_request->>'defaultSource',
    case when p_request->>'defaultSource' = 'literal' then p_request->'defaultValue' end,
    p_request->>'riskClass', policy,
    array(select value from jsonb_array_elements_text(p_request->'consumerKeys') value),
    p_request->>'sensitivity', p_request->>'contractRelease', 'active',
    platform_private.cfg_hash_json(p_request->'schema'), actor.actor_id,
    pg_catalog.clock_timestamp(),
    case when p_request ? 'deprecationAt' then (p_request->>'deprecationAt')::timestamptz end
  ) returning * into definition;
  response := platform_private.cfg_definition_response(definition, definition_id, true);
  perform platform_private.cfg_emit_effects(
    'config.definition.register', actor.actor_id, actor.acting_party_id,
    'config_definition', definition_id, 'CONFIG_DEFINITION_REGISTERED',
    'config.definition.registered.v1', 'config_definition', definition_id,
    definition.version_no, pg_catalog.jsonb_build_object(
      'definitionId', definition_id,
      'definitionVersionId', definition.id,
      'version', definition.version_no::text
    ), platform_private.cfg_correlation(p_request)
  );
  perform platform_private.cfg_request_complete(reservation.id, 201, response);
  return response;
exception when unique_violation then
  if sqlerrm like '%cfg_definition%' then
    raise exception 'DEFINITION_KEY_REUSED' using errcode = 'P0001';
  end if;
  raise;
end;
$body$;

create or replace function platform_private.cfg_propose_change(
  p_request jsonb
)
returns jsonb
language plpgsql security definer set search_path = ''
as $body$
declare
  actor record;
  reservation platform_private.idempotency_records;
  definition platform_private.cfg_setting_definition_versions%rowtype;
  candidate platform_private.cfg_setting_value_versions%rowtype;
  review platform_private.cfg_config_change_reviews%rowtype;
  v_definition_id uuid;
  expected_version bigint;
  candidate_version bigint;
  v_scope_id uuid;
  rollback_available boolean := false;
  effective_from timestamptz;
  effective_to timestamptz;
  response jsonb;
  correlation_id uuid := platform_private.cfg_correlation(p_request);
begin
  perform platform_private.cfg_require_keys(
    p_request,
    array['definitionId','scopeType','scopeId','environment','typedValue','interval',
      'expectedDefinitionVersion','impactManifest','rollbackCandidate','reason',
      'consumerKeys','idempotencyKey','ifMatch','context']::text[],
    array['definitionId','scopeType','scopeId','environment','typedValue','interval',
      'expectedDefinitionVersion','impactManifest','rollbackCandidate','reason',
      'consumerKeys','idempotencyKey','context']::text[]
  );
  v_definition_id := platform_private.cfg_parse_uuid(p_request->>'definitionId', 'DEFINITION_NOT_FOUND');
  expected_version := platform_private.cfg_parse_version(p_request->>'expectedDefinitionVersion', 'STALE_DEFINITION');
  if not platform_private.cfg_scope_is_valid(
    p_request->>'scopeType', nullif(p_request->>'scopeId',''), nullif(p_request->>'environment',''))
     or pg_catalog.jsonb_typeof(p_request->'typedValue') is null
     or pg_catalog.jsonb_typeof(p_request->'interval') <> 'object'
     or not (p_request->'interval' ?& array['effectiveFrom','effectiveTo']::text[])
     or pg_catalog.jsonb_typeof(p_request->'impactManifest') <> 'object'
     or not platform_private.cfg_json_bounded(p_request->'impactManifest', 4, 65536)
     or pg_catalog.jsonb_typeof(p_request->'consumerKeys') <> 'array'
     or pg_catalog.jsonb_array_length(p_request->'consumerKeys') not between 1 and 64 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  begin
    effective_from := (p_request->'interval'->>'effectiveFrom')::timestamptz;
    if p_request->'interval'->>'effectiveTo' is not null then
      effective_to := (p_request->'interval'->>'effectiveTo')::timestamptz;
    end if;
  exception when others then raise exception 'INVALID_REQUEST' using errcode = 'P0001'; end;
  if effective_to is not null and effective_to <= effective_from then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_request->>'scopeId' is not null and p_request->>'scopeId' <> '' then
    v_scope_id := platform_private.cfg_parse_uuid(p_request->>'scopeId');
  end if;
  select * into actor from platform_private.cfg_request_actor(p_request, true);
  if p_request->>'scopeType' = 'party' and v_scope_id is distinct from actor.acting_party_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_request->>'scopeType' = 'user'
     and v_scope_id is distinct from actor.actor_id
     and v_scope_id is distinct from platform_private.identity_actor_person(actor.actor_id) then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if p_request->>'scopeType' = 'platform' then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  reservation := platform_private.cfg_request_reserve(p_request, actor.actor_id, 'config.change.propose');
  if reservation.state = 'completed'::platform_private.idempotency_state then
    return coalesce(reservation.response_ref->'responseBody', reservation.response_ref);
  end if;
  select definition_version.* into definition
    from platform_private.cfg_setting_definition_versions definition_version
   where definition_version.definition_id = v_definition_id
     and definition_version.version_no = expected_version
     and definition_version.lifecycle = 'active'
   for update;
  if not found then raise exception 'STALE_DEFINITION' using errcode = 'P0001'; end if;
  perform platform_private.cfg_require_capability(
    actor.actor_id,
    actor.acting_party_id,
    definition.owner_capability
  );
  if definition.risk_class in ('high', 'emergency') then
    perform platform_private.cfg_require_fresh_step_up(p_request);
  end if;
  if definition.sensitivity = 'restricted' then
    -- Restricted values are supplied by server bindings and never cross a
    -- browser proposal or idempotency-response boundary.
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if not (p_request->>'scopeType' = any(definition.allowed_scopes))
     or exists (
       select 1 from jsonb_array_elements_text(p_request->'consumerKeys') value
        where not (value = any(definition.consumer_keys))
     )
     or not platform_private.cfg_validate_value(
       definition.value_kind, definition.schema, p_request->'typedValue') then
    raise exception 'VALUE_INVALID' using errcode = 'P0001';
  end if;
  if p_request->'rollbackCandidate' <> 'null'::jsonb
     and not platform_private.cfg_validate_value(
       definition.value_kind, definition.schema, p_request->'rollbackCandidate') then
    raise exception 'VALUE_INVALID' using errcode = 'P0001';
  end if;
  rollback_available := p_request->'rollbackCandidate' <> 'null'::jsonb;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_definition_id::text || ':' || (p_request->>'scopeType') || ':' || coalesce(p_request->>'scopeId','') || ':' || coalesce(p_request->>'environment',''), 0));
  select coalesce(max(value_version.version_no), 0) + 1 into candidate_version
    from platform_private.cfg_setting_value_versions value_version
   where value_version.definition_id = v_definition_id
     and value_version.scope_type = p_request->>'scopeType'
     and value_version.scope_id is not distinct from v_scope_id
     and value_version.environment is not distinct from nullif(p_request->>'environment','');
  insert into platform_private.cfg_setting_value_versions(
    definition_id, definition_version_id, scope_type, scope_id, environment,
    typed_value, effective_from, effective_to, state, author_person_id,
    acting_party_id, supersedes_id, value_hash, version_no, created_at, updated_at
  ) values (
    definition.definition_id, definition.id, p_request->>'scopeType', v_scope_id,
    nullif(p_request->>'environment',''), p_request->'typedValue', effective_from,
    effective_to, 'draft', actor.actor_id, actor.acting_party_id, null,
    platform_private.cfg_hash_json(p_request->'typedValue'), candidate_version,
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ) returning * into candidate;
  insert into platform_private.cfg_config_change_reviews(
    candidate_type, candidate_id, candidate_version, frozen_hash, impact_manifest,
    impact_manifest_hash, effective_context_hash, rollback_value, rollback_hash,
    risk_class, required_approvals, state, submitted_by, submitted_at, version_no,
    created_at, updated_at
  ) values (
    'setting_value', candidate.id, candidate.version_no, candidate.value_hash,
    p_request->'impactManifest', platform_private.cfg_hash_json(p_request->'impactManifest'),
    platform_private.cfg_hash_json(p_request->'context'),
    case when rollback_available then p_request->'rollbackCandidate' end,
    case when rollback_available then platform_private.cfg_hash_json(p_request->'rollbackCandidate') end,
    definition.risk_class,
    greatest(1, least(5, coalesce((definition.approver_policy->>'minimumDistinct')::integer, 1))),
    'draft', actor.actor_id, pg_catalog.clock_timestamp(), 1,
    pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp()
  ) returning * into review;
  response := pg_catalog.jsonb_build_object(
    'reviewId', review.id,
    'candidateValueVersionId', candidate.id,
    'definitionId', definition.definition_id,
    'definitionVersion', definition.version_no::text,
    'state', 'draft',
    'valueHash', candidate.value_hash,
    'impactManifestHash', review.impact_manifest_hash,
    'effectivePreview', candidate.typed_value,
    'rollbackAvailable', rollback_available,
    'submittedAt', review.submitted_at
  );
  perform platform_private.cfg_emit_effects(
    'config.change.propose', actor.actor_id, actor.acting_party_id,
    'config_change_review', review.id, 'CONFIG_CHANGE_PROPOSED',
    'config.change.proposed.v1', 'config_change_review', review.id,
    review.version_no, pg_catalog.jsonb_build_object(
      'reviewId', review.id,
      'candidateId', candidate.id,
      'candidateVersion', candidate.version_no::text
    ), correlation_id
  );
  perform platform_private.cfg_request_complete(reservation.id, 201, response);
  return response;
exception when unique_violation then
  raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
end;
$body$;

commit;
