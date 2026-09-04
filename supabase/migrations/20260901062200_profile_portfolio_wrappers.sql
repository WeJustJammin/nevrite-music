begin;
-- Read and write API wrappers.  Only named functions are exposed; base tables
-- remain inaccessible to browser and service roles.
create or replace function profile_api.put_section(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_private.profile_section_mutate(p_request)
$body$;
create or replace function profile_api.put_emphasis(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_private.profile_emphasis_mutate(p_request)
$body$;
create or replace function profile_api.reel_create(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_private.profile_reel_mutate(p_request || jsonb_build_object('action','create'))
$body$;
create or replace function profile_api.reel_patch(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_private.profile_reel_mutate(p_request || jsonb_build_object('action','patch'))
$body$;
create or replace function profile_api.reel_takedown(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_private.profile_reel_mutate(p_request || jsonb_build_object('action','takedown'))
$body$;
create or replace function profile_api.observation_apply(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_private.profile_apply_observation(p_request)
$body$;
create or replace function profile_api.public_facts(p_party_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $body$
  select pg_catalog.jsonb_build_object(
    'partyId', p_party_id,
    'facts', coalesce(pg_catalog.jsonb_agg(to_jsonb(f) order by f.occurred_on desc, f.source_id), '[]'::jsonb)
  )
    from profiles.public_profile_facts f
   where f.party_id = p_party_id
$body$;

-- Conventional platform API aliases keep the HTTP boundary independent of the
-- private implementation schema.
create or replace function platform_api.rpc_profile_section(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_api.put_section(p_request)
$body$;
create or replace function platform_api.rpc_profile_emphasis(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_api.put_emphasis(p_request)
$body$;
create or replace function platform_api.rpc_profile_reel_create(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_api.reel_create(p_request)
$body$;
create or replace function platform_api.rpc_profile_reel_patch(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_api.reel_patch(p_request)
$body$;
create or replace function platform_api.rpc_profile_reel_takedown(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_api.reel_takedown(p_request)
$body$;
create or replace function platform_api.rpc_profile_observation_apply(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select profile_api.observation_apply(p_request)
$body$;
create or replace function platform_api.rpc_profile_public_facts(p_party_id uuid)
returns jsonb language sql stable security definer set search_path = '' as $body$
  select profile_api.public_facts(p_party_id)
$body$;

revoke all on schema profile_api from public, anon, authenticated, service_role;
grant usage on schema profile_api to anon, authenticated, service_role;
revoke all on function profile_api.put_section(jsonb) from public, anon, authenticated, service_role;
revoke all on function profile_api.put_emphasis(jsonb) from public, anon, authenticated, service_role;
revoke all on function profile_api.reel_create(jsonb) from public, anon, authenticated, service_role;
revoke all on function profile_api.reel_patch(jsonb) from public, anon, authenticated, service_role;
revoke all on function profile_api.reel_takedown(jsonb) from public, anon, authenticated, service_role;
revoke all on function profile_api.observation_apply(jsonb) from public, anon, authenticated, service_role;
revoke all on function profile_api.public_facts(uuid) from public, anon, authenticated, service_role;
grant execute on function profile_api.put_section(jsonb) to authenticated, service_role;
grant execute on function profile_api.put_emphasis(jsonb) to authenticated, service_role;
grant execute on function profile_api.reel_create(jsonb) to authenticated, service_role;
grant execute on function profile_api.reel_patch(jsonb) to authenticated, service_role;
grant execute on function profile_api.reel_takedown(jsonb) to authenticated, service_role;
grant execute on function profile_api.observation_apply(jsonb) to service_role;
grant execute on function profile_api.public_facts(uuid) to anon, authenticated, service_role;

revoke all on function platform_api.rpc_profile_section(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_profile_emphasis(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_profile_reel_create(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_profile_reel_patch(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_profile_reel_takedown(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_profile_observation_apply(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_profile_public_facts(uuid) from public, anon, authenticated, service_role;
grant execute on function platform_api.rpc_profile_section(jsonb) to authenticated, service_role;
grant execute on function platform_api.rpc_profile_emphasis(jsonb) to authenticated, service_role;
grant execute on function platform_api.rpc_profile_reel_create(jsonb) to authenticated, service_role;
grant execute on function platform_api.rpc_profile_reel_patch(jsonb) to authenticated, service_role;
grant execute on function platform_api.rpc_profile_reel_takedown(jsonb) to authenticated, service_role;
grant execute on function platform_api.rpc_profile_observation_apply(jsonb) to service_role;
grant execute on function platform_api.rpc_profile_public_facts(uuid) to anon, authenticated, service_role;

commit;
