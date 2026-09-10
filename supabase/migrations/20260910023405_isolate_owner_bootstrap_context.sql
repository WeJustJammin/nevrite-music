-- Forward-only correction: isolate operator setup from stale browser contexts.
create or replace function platform_private.initialize_cms_owner(
  p_auth_user_id uuid,
  p_person_id uuid,
  p_expected_email text,
  p_grant_ends_at timestamptz,
  p_authorization_ref uuid,
  p_preview boolean
) returns jsonb
language plpgsql security invoker
set search_path = ''
set timezone = 'UTC'
as $body$
declare
  now_at timestamptz := clock_timestamp();
  alias_result jsonb;
  organization_result jsonb;
  alias_id uuid;
  organization_id uuid;
  setting_name text;
  previous_settings jsonb := '{}'::jsonb;
  capability text;
begin
  if current_user <> 'postgres' then
    raise exception 'BOOTSTRAP_OPERATOR_REQUIRED' using errcode = 'P0001';
  end if;
  if p_auth_user_id is null or p_person_id is null or p_authorization_ref is null
     or p_preview is null or p_expected_email is null
     or p_grant_ends_at is null
     or p_grant_ends_at <= now_at
     or (p_grant_ends_at at time zone 'UTC')::date <= current_date
     or p_grant_ends_at > now_at + interval '7 days' then
    raise exception 'BOOTSTRAP_INVALID' using errcode = 'P0001';
  end if;
  -- Serialize the empty-authority check with competing initializations and grants.
  lock table platform_private.cms_owner_initialization,
    identity_private.organization_actor_grant,
    platform_private.admin_capability_grants in share row exclusive mode;
  if exists (select 1 from platform_private.cms_owner_initialization) then
    raise exception 'BOOTSTRAP_ALREADY_INITIALIZED' using errcode = 'P0001';
  end if;
  perform 1 from auth.users u
    join platform_private.person_party p on p.auth_user_id = u.id
    where u.id = p_auth_user_id and p.party_id = p_person_id
      and lower(u.email) = lower(p_expected_email)
      and u.email_confirmed_at is not null and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= now_at)
      and p.account_state in ('claimed','active')
    for update of u,p;
  if not found then
    raise exception 'BOOTSTRAP_IDENTITY_MISMATCH' using errcode = 'P0001';
  end if;
  if exists (select 1 from identity_private.organization_actor_grant
      where capability_code like 'cms.%' or capability_code like 'admin.%')
     or exists (select 1 from platform_private.admin_capability_grants) then
    raise exception 'BOOTSTRAP_AUTHORITY_EXISTS' using errcode = 'P0001';
  end if;
  if exists (select 1 from platform_private.handle_reservation
      where normalized_handle = 'webejammin') then
    raise exception 'BOOTSTRAP_HANDLE_UNAVAILABLE' using errcode = 'P0001';
  end if;
  if p_preview then
    return jsonb_build_object('state','preview','personId',p_person_id,
      'handle','WeBeJammin','grantEndsAt',p_grant_ends_at,
      'capabilities',jsonb_build_array('cms.schema_registry.read','cms.schema_designer',
        'admin.inbox.read','admin.audit.read'));
  end if;

  -- Existing identity operations require actor context. The operator receipt below
  -- identifies this as owner-authorized initialization, not an interactive login.
  foreach setting_name in array array['app.auth_user_id','request.jwt.claim.sub',
    'app.actor_auth_user_id','app.actor_person_id','app.acting_party_id','app.acting_context_id',
    'app.idempotency_key_hash','app.request_hash','app.correlation_id'] loop
    previous_settings := previous_settings || jsonb_build_object(
      setting_name,coalesce(current_setting(setting_name,true),''));
  end loop;
  perform set_config('app.auth_user_id',p_auth_user_id::text,true);
  perform set_config('request.jwt.claim.sub',p_auth_user_id::text,true);
  perform set_config('app.actor_auth_user_id',p_auth_user_id::text,true);
  perform set_config('app.actor_person_id',p_person_id::text,true);
  -- Operator initialization has no browser-selected acting context. Clearing
  -- these settings selects the canonical self-person default without refreshing
  -- or changing any existing session/context binding.
  perform set_config('app.acting_party_id','',true);
  perform set_config('app.acting_context_id','',true);
  perform set_config('app.correlation_id',p_authorization_ref::text,true);
  perform set_config('app.idempotency_key_hash',p_authorization_ref::text || ':alias',true);
  perform set_config('app.request_hash',p_authorization_ref::text || ':alias',true);
  alias_result := platform_api.identity_alias_create('WeBeJammin','WeBeJammin','private');
  alias_id := (alias_result->>'aliasId')::uuid;
  perform set_config('app.idempotency_key_hash',p_authorization_ref::text || ':organization',true);
  perform set_config('app.request_hash',p_authorization_ref::text || ':organization',true);
  organization_result := platform_api.rpc_create_organization('self_member','{}'::text[]);
  organization_id := (organization_result->>'organizationId')::uuid;

  foreach capability in array array['cms.schema_registry.read','cms.schema_designer',
    'admin.inbox.read','admin.audit.read'] loop
    insert into identity_private.organization_actor_grant(
      organization_id,person_id,capability_code,valid_from,valid_through,active)
    values(organization_id,p_person_id,capability,current_date,
      (p_grant_ends_at at time zone 'UTC')::date - 1,true);
  end loop;
  foreach capability in array array['admin.inbox.read','admin.audit.read'] loop
    insert into platform_private.admin_capability_grants(
      subject_person_id,capability_key,resource_type,resource_id,scope,actions,
      starts_at,ends_at,grantor_person_id,reason,purpose_grant,state,version_no)
    values(p_person_id,capability,'organization',organization_id,
      jsonb_build_object('actingPartyId',organization_id),array['read'],now_at,
      p_grant_ends_at,p_person_id,'Owner-authorized initial setup; see initialization receipt',
      false,'active',1);
  end loop;
  insert into platform_private.cms_owner_initialization(
    auth_user_id,person_id,alias_id,organization_id,authorization_ref,operator_role,grant_ends_at)
  values(p_auth_user_id,p_person_id,alias_id,organization_id,p_authorization_ref,
    current_user,p_grant_ends_at);
  insert into audit_private.audit_events(action,actor_id,acting_party_id,target_type,
    target_id,decision,reason_code,correlation_id)
  values('operator.cms_owner.initialize',p_auth_user_id,organization_id,'organization',
    organization_id,'allowed','OWNER_AUTHORIZED_OPERATOR_INITIALIZATION',p_authorization_ref);
  for setting_name in select jsonb_object_keys(previous_settings) loop
    perform set_config(setting_name,previous_settings->>setting_name,true);
  end loop;
  return jsonb_build_object('state','initialized','personId',p_person_id,
    'aliasId',alias_id,'organizationId',organization_id,'grantEndsAt',p_grant_ends_at);
end;
$body$;
revoke all on function platform_private.initialize_cms_owner(uuid,uuid,text,timestamptz,uuid,boolean)
  from public,anon,authenticated,service_role;
comment on function platform_private.initialize_cms_owner(uuid,uuid,text,timestamptz,uuid,boolean)
  is 'One-time operator initialization only. Never use as hosted login, MFA or AC265 evidence.';
