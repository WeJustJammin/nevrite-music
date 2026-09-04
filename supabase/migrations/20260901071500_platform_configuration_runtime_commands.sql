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

create or replace function platform_private.cfg_resolve_effective_value(
  p_request jsonb
)
returns jsonb
language plpgsql security definer set search_path = ''
as $body$
declare
  actor record;
  is_service_consumer boolean := false;
  definition platform_private.cfg_setting_definition_versions%rowtype;
  selected_definition_id uuid;
  at_time timestamptz;
  supported bigint[];
  supported_text text;
  candidate_values jsonb[];
  candidate_ids uuid[];
  candidate_scopes text[];
  candidate_subjects uuid[];
  candidate_from timestamptz[];
  candidate_to timestamptz[];
  selected_value jsonb;
  selected_scope text;
  selected_subject uuid;
  selected_value_id uuid;
  selected_from timestamptz;
  selected_to timestamptz;
  merged jsonb;
  item jsonb;
  source_default boolean := false;
  compatibility text := 'exact';
  party_id uuid;
  site_id uuid;
  user_id uuid;
  evaluator_version bigint;
  response jsonb;
  correlation_id uuid;
begin
  perform platform_private.cfg_require_keys(
    p_request,
    array['key','environment','partyId','siteId','route','feature','userId',
      'consumerKey','supportedDefinitionVersions','at','context']::text[],
    array['key','consumerKey','supportedDefinitionVersions']::text[]
  );
  if not platform_private.cfg_valid_key(p_request->>'key')
     or not platform_private.cfg_valid_key(p_request->>'consumerKey')
     or pg_catalog.jsonb_typeof(p_request->'supportedDefinitionVersions') <> 'array'
     or pg_catalog.jsonb_array_length(p_request->'supportedDefinitionVersions') not between 1 and 8 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  for supported_text in select value from jsonb_array_elements_text(p_request->'supportedDefinitionVersions') value loop
    supported := array_append(supported, platform_private.cfg_parse_version(supported_text));
  end loop;
  if p_request ? 'environment' and pg_catalog.length(p_request->>'environment') not between 1 and 64 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_request ? 'partyId' then party_id := platform_private.cfg_parse_uuid(p_request->>'partyId'); end if;
  if p_request ? 'siteId' then site_id := platform_private.cfg_parse_uuid(p_request->>'siteId'); end if;
  if p_request ? 'userId' then user_id := platform_private.cfg_parse_uuid(p_request->>'userId'); end if;
  if p_request ? 'route' and p_request->>'route' !~ '^/[A-Za-z0-9/_-]{0,255}$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if p_request ? 'feature' and not platform_private.cfg_valid_key(p_request->>'feature') then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  begin
    at_time := case when p_request ? 'at' then (p_request->>'at')::timestamptz else pg_catalog.clock_timestamp() end;
  exception when others then raise exception 'INVALID_REQUEST' using errcode = 'P0001'; end;

  is_service_consumer := platform_private.cfg_context_value(p_request, 'serviceConsumerKey') is not null;
  if is_service_consumer then
    if platform_private.cfg_context_value(p_request, 'serviceConsumerKey') <> p_request->>'consumerKey'
       or not platform_private.cfg_valid_key(
         platform_private.cfg_context_value(p_request, 'servicePrincipalId')
       ) then
      raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
    end if;
  else
    select * into actor from platform_private.cfg_request_actor(p_request, true);
    if party_id is not null and party_id is distinct from actor.acting_party_id then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
    if user_id is not null
       and user_id is distinct from actor.actor_id
       and user_id is distinct from platform_private.identity_actor_person(actor.actor_id) then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
    if site_id is not null then
      -- Site authority needs an explicit registered consumer/grant.  A human
      -- may not select an arbitrary site identifier through this resolver.
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
  end if;

  -- Select an explicitly compatible definition first.  A known key with no
  -- readable consumer is deliberately indistinguishable from a missing key.
  select definition_version.* into definition
    from platform_private.cfg_setting_definition_versions definition_version
   where definition_version.key = p_request->>'key'
     and definition_version.lifecycle = 'active'
     and p_request->>'consumerKey' = any(definition_version.consumer_keys)
   order by case when definition_version.version_no = any(supported) then 0 else 1 end,
            definition_version.version_no desc
   limit 1;
  if not found then raise exception 'DEFINITION_NOT_FOUND' using errcode = 'P0001'; end if;
  if not is_service_consumer then
    perform platform_private.cfg_require_capability(
      actor.actor_id,
      actor.acting_party_id,
      definition.owner_capability
    );
    if definition.sensitivity = 'restricted' then
      raise exception 'DEFINITION_NOT_FOUND' using errcode = 'P0001';
    end if;
  end if;
  evaluator_version := definition.version_no;
  if not evaluator_version = any(supported) then
    compatibility := 'contract_fallback';
  elsif evaluator_version <> (select max(value) from unnest(supported) value where value <= evaluator_version) then
    compatibility := 'last_compatible';
  end if;
  selected_definition_id := definition.definition_id;
  correlation_id := platform_private.cfg_correlation(p_request);

  select array_agg(value_version.typed_value order by array_position(definition.precedence, value_version.scope_type), value_version.effective_from desc, value_version.id desc),
         array_agg(value_version.id order by array_position(definition.precedence, value_version.scope_type), value_version.effective_from desc, value_version.id desc),
         array_agg(value_version.scope_type order by array_position(definition.precedence, value_version.scope_type), value_version.effective_from desc, value_version.id desc),
         array_agg(value_version.scope_id order by array_position(definition.precedence, value_version.scope_type), value_version.effective_from desc, value_version.id desc),
         array_agg(value_version.effective_from order by array_position(definition.precedence, value_version.scope_type), value_version.effective_from desc, value_version.id desc),
         array_agg(value_version.effective_to order by array_position(definition.precedence, value_version.scope_type), value_version.effective_from desc, value_version.id desc)
    into candidate_values, candidate_ids, candidate_scopes, candidate_subjects, candidate_from, candidate_to
    from platform_private.cfg_setting_value_versions value_version
   where value_version.definition_id = selected_definition_id
     and value_version.definition_version_id = definition.id
     and value_version.state = 'active'
     and value_version.effective_from <= at_time
     and (value_version.effective_to is null or value_version.effective_to > at_time)
     and value_version.scope_type = any(definition.allowed_scopes)
     and (
       (value_version.scope_type = 'platform' and value_version.scope_id is null and value_version.environment is null)
       or (value_version.scope_type = 'environment' and p_request ? 'environment'
           and value_version.scope_id is null and value_version.environment = p_request->>'environment')
       or (value_version.scope_type = 'party' and party_id is not null
           and value_version.scope_id = party_id
           and (value_version.environment is null or value_version.environment = p_request->>'environment'))
       or (value_version.scope_type = 'site' and site_id is not null
           and value_version.scope_id = site_id
           and (value_version.environment is null or value_version.environment = p_request->>'environment'))
       or (value_version.scope_type = 'user' and user_id is not null
           and value_version.scope_id = user_id
           and (value_version.environment is null or value_version.environment = p_request->>'environment'))
       or (value_version.scope_type = 'route' and p_request ? 'route'
           and value_version.scope_id is null
           and (value_version.environment is null or value_version.environment = p_request->>'environment'))
       or (value_version.scope_type = 'feature' and p_request ? 'feature'
           and value_version.scope_id is null
           and (value_version.environment is null or value_version.environment = p_request->>'environment'))
     );

  if candidate_values is null or cardinality(candidate_values) = 0 then
    source_default := true;
    selected_value := definition.default_value;
    selected_scope := 'platform';
    selected_subject := null;
    selected_value_id := null;
    selected_from := null;
    selected_to := null;
    if definition.default_source = 'required' then
      raise exception 'VALUE_UNAVAILABLE' using errcode = 'P0001';
    elsif definition.default_source = 'contract' then
      selected_value := 'null'::jsonb;
      compatibility := 'contract_fallback';
    end if;
  elsif definition.merge_mode = 'replace' then
    selected_value := candidate_values[1];
    selected_scope := candidate_scopes[1];
    selected_subject := candidate_subjects[1];
    selected_value_id := candidate_ids[1];
    selected_from := candidate_from[1];
    selected_to := candidate_to[1];
  elsif definition.merge_mode = 'append_unique' then
    merged := '[]'::jsonb;
    for index_no in 1..cardinality(candidate_values) loop
      if pg_catalog.jsonb_typeof(candidate_values[index_no]) <> 'array' then
        raise exception 'VALUE_UNAVAILABLE' using errcode = 'P0001';
      end if;
      for item in select value from jsonb_array_elements(candidate_values[index_no]) value loop
        if not exists (
          select 1 from jsonb_array_elements(merged) existing where existing = item
        ) then
          merged := merged || jsonb_build_array(item);
        end if;
      end loop;
    end loop;
    selected_value := merged;
    selected_scope := candidate_scopes[1];
    selected_subject := candidate_subjects[1];
    selected_value_id := candidate_ids[1];
    selected_from := candidate_from[1];
    selected_to := candidate_to[1];
  else
    merged := '{}'::jsonb;
    for index_no in reverse 1..cardinality(candidate_values) loop
      if pg_catalog.jsonb_typeof(candidate_values[index_no]) <> 'object' then
        raise exception 'VALUE_UNAVAILABLE' using errcode = 'P0001';
      end if;
      merged := merged || candidate_values[index_no];
    end loop;
    selected_value := merged;
    selected_scope := candidate_scopes[1];
    selected_subject := candidate_subjects[1];
    selected_value_id := candidate_ids[1];
    selected_from := candidate_from[1];
    selected_to := candidate_to[1];
  end if;
  if not platform_private.cfg_json_bounded(selected_value, 8, 65536) then
    raise exception 'VALUE_UNAVAILABLE' using errcode = 'P0001';
  end if;
  response := pg_catalog.jsonb_build_object(
    'definitionId', definition.definition_id,
    'definitionVersionId', definition.id,
    'key', definition.key,
    'valueKind', definition.value_kind,
    'typedValue', selected_value,
    'sourceScope', selected_scope,
    'sourceSubjectId', selected_subject,
    'sourceValueVersionId', selected_value_id,
    'isDefault', source_default,
    'effectiveFrom', selected_from,
    'effectiveTo', selected_to,
    'evaluatedAt', at_time,
    'evaluatorVersion', evaluator_version::text,
    'correlationId', correlation_id,
    'compatibility', compatibility
  );
  return response;
end;
$body$;

create or replace function platform_private.cfg_change_action(
  p_request jsonb
)
returns jsonb
language plpgsql security definer set search_path = ''
as $body$
declare
  actor record;
  reservation platform_private.idempotency_records;
  review platform_private.cfg_config_change_reviews%rowtype;
  candidate platform_private.cfg_setting_value_versions%rowtype;
  definition platform_private.cfg_setting_definition_versions%rowtype;
  active_value platform_private.cfg_setting_value_versions%rowtype;
  action_name text;
  expected_review_version bigint;
  approval_count integer;
  snapshot_id uuid;
  resulting_id uuid;
  resulting_version bigint;
  resulting_state text;
  effective_at timestamptz;
  scheduled_for timestamptz;
  rollback_value jsonb;
  snapshot_hash text;
  transition_event_id uuid;
  snapshot_event_id uuid;
  response jsonb;
  correlation_id uuid := platform_private.cfg_correlation(p_request);
begin
  perform platform_private.cfg_require_keys(
    p_request,
    array['reviewId','action','expectedReviewVersion','candidateHash','approvalReason',
      'stepUpToken','scheduledFor','rollbackValue','canaryPercent','idempotencyKey',
      'ifMatch','context']::text[],
    array['reviewId','action','expectedReviewVersion','candidateHash','approvalReason',
      'idempotencyKey','context']::text[]
  );
  if p_request->>'action' not in ('approve','schedule','activate','rollback')
     or p_request->>'candidateHash' !~ '^[a-f0-9]{64}$'
     or pg_catalog.length(pg_catalog.btrim(p_request->>'approvalReason')) not between 1 and 512 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  action_name := p_request->>'action';
  expected_review_version := platform_private.cfg_parse_version(p_request->>'expectedReviewVersion', 'VERSION_CONFLICT');
  if p_request ? 'canaryPercent' and (
    pg_catalog.jsonb_typeof(p_request->'canaryPercent') <> 'number'
    or (p_request->>'canaryPercent')::numeric < 0
    or (p_request->>'canaryPercent')::numeric > 100
  ) then raise exception 'INVALID_REQUEST' using errcode = 'P0001'; end if;
  if p_request ? 'stepUpToken' and pg_catalog.length(p_request->>'stepUpToken') not between 20 and 4096 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  begin
    if p_request ? 'scheduledFor' and p_request->>'scheduledFor' is not null then
      scheduled_for := (p_request->>'scheduledFor')::timestamptz;
    end if;
  exception when others then raise exception 'INVALID_REQUEST' using errcode = 'P0001'; end;
  if action_name = 'schedule' and scheduled_for is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  select * into actor from platform_private.cfg_request_actor(p_request, true);
  reservation := platform_private.cfg_request_reserve(p_request, actor.actor_id, 'config.change.action');
  if reservation.state = 'completed'::platform_private.idempotency_state then
    return coalesce(reservation.response_ref->'responseBody', reservation.response_ref);
  end if;
  select * into review
    from platform_private.cfg_config_change_reviews review_row
   where review_row.id = platform_private.cfg_parse_uuid(p_request->>'reviewId', 'REVIEW_NOT_FOUND')
   for update;
  if not found then raise exception 'REVIEW_NOT_FOUND' using errcode = 'P0001'; end if;
  if review.version_no <> expected_review_version
     or (p_request ? 'ifMatch' and p_request->>'ifMatch' <> expected_review_version::text)
     or review.frozen_hash <> p_request->>'candidateHash' then
    raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
  end if;
  select * into candidate
    from platform_private.cfg_setting_value_versions value_version
   where value_version.id = review.candidate_id
     and value_version.version_no = review.candidate_version
   for update;
  if not found then raise exception 'REVIEW_NOT_FOUND' using errcode = 'P0001'; end if;
  select * into definition
    from platform_private.cfg_setting_definition_versions definition_version
   where definition_version.id = candidate.definition_version_id
     and definition_version.definition_id = candidate.definition_id
     and definition_version.lifecycle = 'active'
   for update;
  if not found then raise exception 'STALE_DEFINITION' using errcode = 'P0001'; end if;
  if candidate.acting_party_id is null
     or candidate.acting_party_id is distinct from actor.acting_party_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  perform platform_private.cfg_require_capability(
    actor.actor_id,
    actor.acting_party_id,
    case action_name
      when 'approve' then 'settings.approve'
      when 'rollback' then 'settings.rollback'
      else 'settings.release'
    end
  );
  if definition.risk_class in ('high','emergency')
     or coalesce((definition.approver_policy->>'requiresMfa')::boolean, false)
     or action_name in ('activate','rollback') then
    perform platform_private.cfg_require_fresh_step_up(p_request);
  end if;
  if action_name = 'activate'
     and coalesce((definition.approver_policy->>'requiresCanary')::boolean, false)
     and (
       not (p_request ? 'canaryPercent')
       or (p_request->>'canaryPercent')::numeric <= 0
       or (p_request->>'canaryPercent')::numeric > 100
     ) then
    raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
  end if;
  if action_name = 'approve' then
    if actor.actor_id = review.submitted_by
       or review.state not in ('draft','review')
       or candidate.state not in ('draft','review') then
      raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
    end if;
    if exists (
      select 1 from platform_private.cfg_config_approvals approval
       where approval.review_id = review.id and approval.reviewer_person_id = actor.actor_id
    ) then raise exception 'APPROVAL_INVALID' using errcode = 'P0001'; end if;
    insert into platform_private.cfg_config_approvals(
      review_id, reviewer_person_id, acting_party_id, capability, decision,
      reason, reviewed_hash, decided_at, review_version
    ) values (
      review.id, actor.actor_id, actor.acting_party_id, 'settings.approve', 'approve',
      p_request->>'approvalReason', review.frozen_hash, pg_catalog.clock_timestamp(),
      -- The review CAS below advances version_no as part of this approval.
      -- Bind the append-only approval to that resulting current version so
      -- consumers can reject a stale review without weakening the CAS.
      review.version_no + 1
    );
    select count(*) into approval_count
      from platform_private.cfg_config_approvals approval
     where approval.review_id = review.id and approval.decision = 'approve';
    resulting_state := case when approval_count >= review.required_approvals then 'approved' else 'review' end;
    update platform_private.cfg_config_change_reviews
       set state = resulting_state, version_no = version_no + 1, updated_at = pg_catalog.clock_timestamp()
     where id = review.id and version_no = expected_review_version;
    update platform_private.cfg_setting_value_versions
       set state = resulting_state, updated_at = pg_catalog.clock_timestamp()
     where id = candidate.id;
    select * into review from platform_private.cfg_config_change_reviews where id = review.id;
    resulting_id := candidate.id;
    resulting_version := candidate.version_no;
    effective_at := null;
  elsif action_name = 'schedule' then
    if review.state <> 'approved' or candidate.state <> 'approved' then
      raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
    end if;
    if scheduled_for <= pg_catalog.clock_timestamp() then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    select count(*) into approval_count
      from platform_private.cfg_config_approvals approval
     where approval.review_id = review.id and approval.decision = 'approve';
    if approval_count < review.required_approvals then raise exception 'APPROVAL_INVALID' using errcode = 'P0001'; end if;
    update platform_private.cfg_config_change_reviews
       set state = 'scheduled', version_no = version_no + 1, updated_at = pg_catalog.clock_timestamp()
     where id = review.id and version_no = expected_review_version;
    update platform_private.cfg_setting_value_versions
       set state = 'scheduled', effective_from = scheduled_for, updated_at = pg_catalog.clock_timestamp()
     where id = candidate.id;
    select * into review from platform_private.cfg_config_change_reviews where id = review.id;
    resulting_state := 'scheduled';
    resulting_id := candidate.id;
    resulting_version := candidate.version_no;
    effective_at := scheduled_for;
    select count(*) into approval_count from platform_private.cfg_config_approvals approval where approval.review_id = review.id and approval.decision = 'approve';
  elsif action_name = 'activate' then
    if review.state not in ('approved','scheduled') or candidate.state not in ('approved','scheduled') then
      raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
    end if;
    select count(*) into approval_count
      from platform_private.cfg_config_approvals approval
     where approval.review_id = review.id and approval.decision = 'approve';
    if approval_count < review.required_approvals then raise exception 'APPROVAL_INVALID' using errcode = 'P0001'; end if;
    select * into active_value
      from platform_private.cfg_setting_value_versions value_version
     where value_version.definition_id = candidate.definition_id
       and value_version.scope_type = candidate.scope_type
       and value_version.scope_id is not distinct from candidate.scope_id
       and value_version.environment is not distinct from candidate.environment
       and value_version.state = 'active'
     order by value_version.version_no desc limit 1 for update;
    if found then
      update platform_private.cfg_setting_value_versions
         set state = 'superseded', effective_to = case when effective_to is null then pg_catalog.clock_timestamp() else effective_to end,
             updated_at = pg_catalog.clock_timestamp()
       where id = active_value.id;
    end if;
    update platform_private.cfg_setting_value_versions
       set state = 'active', supersedes_id = case when found then active_value.id end,
           updated_at = pg_catalog.clock_timestamp()
     where id = candidate.id;
    update platform_private.cfg_config_change_reviews
       set state = 'active', version_no = version_no + 1, updated_at = pg_catalog.clock_timestamp()
     where id = review.id and version_no = expected_review_version;
    snapshot_hash := platform_private.cfg_hash_json(jsonb_build_object(
      'definitionId', candidate.definition_id, 'definitionVersionId', candidate.definition_version_id,
      'valueVersionId', candidate.id, 'candidateHash', candidate.value_hash));
    insert into platform_private.cfg_snapshot_intents(
      review_id, value_version_id, requested_by, config_hash, state, requested_at
    ) values (
      review.id, candidate.id, actor.actor_id, snapshot_hash, 'pending', pg_catalog.clock_timestamp()
    ) returning id into snapshot_id;
    snapshot_event_id := platform_private.cfg_emit_effects(
      'config.change.activate', actor.actor_id, actor.acting_party_id,
      'config_change_review', review.id, 'CONFIG_CHANGE_ACTIVATED',
      'config.setting.activated.v1', 'config_definition', candidate.definition_id,
      candidate.version_no, jsonb_build_object(
        'definitionId', candidate.definition_id, 'valueVersionId', candidate.id,
        'scopeType', candidate.scope_type, 'scopeId', candidate.scope_id), correlation_id);
    resulting_state := 'active';
    resulting_id := candidate.id;
    resulting_version := candidate.version_no;
    effective_at := candidate.effective_from;
  else
    if review.state not in ('approved','scheduled','active','rolled_back') then
      raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
    end if;
    if review.rollback_value is null
       or review.rollback_hash is null
       or not (p_request ? 'rollbackValue')
       or p_request->'rollbackValue' = 'null'::jsonb then
      raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
    end if;
    if platform_private.cfg_hash_json(p_request->'rollbackValue') <> review.rollback_hash
       or p_request->'rollbackValue' <> review.rollback_value then
      raise exception 'VERSION_CONFLICT' using errcode = 'P0001';
    end if;
    rollback_value := review.rollback_value;
    select * into active_value
      from platform_private.cfg_setting_value_versions value_version
     where value_version.definition_id = candidate.definition_id
       and value_version.scope_type = candidate.scope_type
       and value_version.scope_id is not distinct from candidate.scope_id
       and value_version.environment is not distinct from candidate.environment
       and value_version.state = 'active'
     order by value_version.version_no desc limit 1 for update;
    select coalesce(max(value_version.version_no), 0) + 1 into resulting_version
      from platform_private.cfg_setting_value_versions value_version
     where value_version.definition_id = candidate.definition_id
       and value_version.scope_type = candidate.scope_type
       and value_version.scope_id is not distinct from candidate.scope_id
       and value_version.environment is not distinct from candidate.environment;
    resulting_id := extensions.gen_random_uuid();
    if found then
      update platform_private.cfg_setting_value_versions
         set state = 'superseded', effective_to = case when effective_to is null then pg_catalog.clock_timestamp() else effective_to end,
             updated_at = pg_catalog.clock_timestamp()
       where id = active_value.id;
    end if;
    insert into platform_private.cfg_setting_value_versions(
      id, definition_id, definition_version_id, scope_type, scope_id, environment,
      typed_value, effective_from, effective_to, state, author_person_id,
      acting_party_id, supersedes_id, value_hash, version_no, created_at, updated_at
    ) values (
      resulting_id, candidate.definition_id, candidate.definition_version_id, candidate.scope_type,
      candidate.scope_id, candidate.environment, rollback_value, pg_catalog.clock_timestamp(), null,
      'active', actor.actor_id, actor.acting_party_id, case when found then active_value.id end,
      platform_private.cfg_hash_json(rollback_value), resulting_version,
      pg_catalog.clock_timestamp(), pg_catalog.clock_timestamp());
    update platform_private.cfg_config_change_reviews
       set state = 'rolled_back', version_no = version_no + 1, updated_at = pg_catalog.clock_timestamp()
     where id = review.id and version_no = expected_review_version;
    select count(*) into approval_count
      from platform_private.cfg_config_approvals approval
     where approval.review_id = review.id and approval.decision = 'approve';
    snapshot_hash := platform_private.cfg_hash_json(jsonb_build_object(
      'definitionId', candidate.definition_id, 'valueVersionId', resulting_id,
      'candidateHash', platform_private.cfg_hash_json(rollback_value)));
    insert into platform_private.cfg_snapshot_intents(
      review_id, value_version_id, requested_by, config_hash, state, requested_at
    ) values (
      review.id, resulting_id, actor.actor_id, snapshot_hash, 'pending', pg_catalog.clock_timestamp()
    ) returning id into snapshot_id;
    snapshot_event_id := platform_private.cfg_emit_effects(
      'config.change.rollback', actor.actor_id, actor.acting_party_id,
      'config_change_review', review.id, 'CONFIG_CHANGE_ROLLED_BACK',
      'config.setting.activated.v1', 'config_definition', candidate.definition_id,
      resulting_version, jsonb_build_object(
        'definitionId', candidate.definition_id, 'valueVersionId', resulting_id,
        'scopeType', candidate.scope_type, 'scopeId', candidate.scope_id), correlation_id);
    resulting_state := 'rolled_back';
    effective_at := pg_catalog.clock_timestamp();
  end if;
  if action_name in ('approve','schedule') then
    transition_event_id := platform_private.cfg_emit_effects(
      'config.change.' || action_name, actor.actor_id, actor.acting_party_id,
      'config_change_review', review.id, 'CONFIG_CHANGE_TRANSITIONED',
      'config.change.transitioned.v1', 'config_change_review', review.id,
      resulting_version, jsonb_build_object(
        'reviewId', review.id, 'resultingValueVersionId', resulting_id,
        'snapshotIntentId', null), correlation_id);
  end if;
  response := jsonb_build_object(
    'reviewId', review.id,
    'resultingValueVersionId', resulting_id,
    'resultingState', resulting_state,
    'resultingVersion', resulting_version::text,
    'candidateHash', p_request->>'candidateHash',
    'approvalCount', coalesce(approval_count, 0),
    'snapshotIntentId', snapshot_id,
    'outboxEventId', coalesce(snapshot_event_id, transition_event_id),
    'effectiveAt', effective_at
  );
  perform platform_private.cfg_request_complete(reservation.id, 200, response);
  return response;
exception when unique_violation then
  raise exception 'APPROVAL_INVALID' using errcode = 'P0001';
end;
$body$;

commit;
