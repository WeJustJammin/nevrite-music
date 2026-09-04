begin;

-- Stable Data API names.  The underlying command functions remain private and
-- all request authorization is re-evaluated inside the transaction.
create or replace function platform_api.cfg_register_definition(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cfg_register_definition(p_request)
$body$;

create or replace function platform_api.cfg_resolve_effective_value(p_request jsonb)
returns jsonb language sql stable security definer set search_path = '' as $body$
  select platform_private.cfg_resolve_effective_value(p_request)
$body$;

create or replace function platform_api.cfg_propose_change(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cfg_propose_change(p_request)
$body$;

create or replace function platform_api.cfg_change_action(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cfg_change_action(p_request)
$body$;

-- Compatibility aliases used by older Worker deployments during rollout.
create or replace function platform_api.rpc_cfg_register_definition(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cfg_register_definition(p_request)
$body$;
create or replace function platform_api.rpc_cfg_resolve_effective_value(p_request jsonb)
returns jsonb language sql stable security definer set search_path = '' as $body$
  select platform_private.cfg_resolve_effective_value(p_request)
$body$;
create or replace function platform_api.rpc_cfg_propose_change(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cfg_propose_change(p_request)
$body$;
create or replace function platform_api.rpc_cfg_change_action(p_request jsonb)
returns jsonb language sql security definer set search_path = '' as $body$
  select platform_private.cfg_change_action(p_request)
$body$;

revoke all on function platform_api.cfg_register_definition(jsonb),
  platform_api.cfg_resolve_effective_value(jsonb),
  platform_api.cfg_propose_change(jsonb),
  platform_api.cfg_change_action(jsonb),
  platform_api.rpc_cfg_register_definition(jsonb),
  platform_api.rpc_cfg_resolve_effective_value(jsonb),
  platform_api.rpc_cfg_propose_change(jsonb),
  platform_api.rpc_cfg_change_action(jsonb)
from public, anon, authenticated, service_role;

grant execute on function platform_api.cfg_register_definition(jsonb),
  platform_api.rpc_cfg_register_definition(jsonb),
  platform_api.cfg_resolve_effective_value(jsonb),
  platform_api.rpc_cfg_resolve_effective_value(jsonb),
  platform_api.cfg_propose_change(jsonb),
  platform_api.rpc_cfg_propose_change(jsonb),
  platform_api.cfg_change_action(jsonb),
  platform_api.rpc_cfg_change_action(jsonb)
to service_role;

revoke all on function platform_private.cfg_parse_uuid(text, text),
  platform_private.cfg_parse_version(text, text),
  platform_private.cfg_request_reserve(jsonb, uuid, text),
  platform_private.cfg_request_complete(uuid, integer, jsonb),
  platform_private.cfg_request_actor(jsonb, boolean),
  platform_private.cfg_release_request_actor(jsonb),
  platform_private.cfg_require_capability(uuid, uuid, text),
  platform_private.cfg_require_fresh_step_up(jsonb, interval),
  platform_private.cfg_scope_is_valid(text, text, text),
  platform_private.cfg_definition_response(platform_private.cfg_setting_definition_versions, uuid, boolean),
  platform_private.cfg_register_definition(jsonb),
  platform_private.cfg_emit_effects(text, uuid, uuid, text, uuid, text, text, text, uuid, bigint, jsonb, uuid),
  platform_private.cfg_resolve_effective_value(jsonb),
  platform_private.cfg_change_action(jsonb)
from public, anon, authenticated, service_role;

commit;
