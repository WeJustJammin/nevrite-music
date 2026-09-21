-- AC265 CP-04a: protected, redacted approved outage-target read boundary.
--
-- CP-01 owns the immutable target rows.  This forward-only migration adds
-- only a service_role RPC over that existing control plane; it neither alters
-- nor seeds target rows.  The RPC derives every returned scope field from the
-- authorization, candidate, and target rows and returns one canonical target
-- projection plus the stored target digest for independent signing checks.

create function platform_api.ac265_approved_outage_target_read(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'targetRef'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_target_ref_pattern constant text :=
    '^ac265-outage-target://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_target_id uuid;
  v_now timestamptz;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_target platform_private.ac265_approved_outage_targets%rowtype;
  v_candidate platform_private.ac265_verified_candidates%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'targetRef') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-approved-outage-target-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'targetRef', '') !~ v_target_ref_pattern then
    raise exception 'AC265 approved outage target read request rejected'
      using errcode = '22023';
  end if;

  begin
    v_authorization_id :=
      substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
    v_target_id := substring(p_request ->> 'targetRef' from v_target_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 approved outage target read request rejected'
      using errcode = '22023';
  end;

  v_now := clock_timestamp();

  -- Authorization validity and all subsequent target/candidate checks use one
  -- server-side time sample.  A caller cannot extend the read window.
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.expires_at > v_now;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select target.*
    into v_target
  from platform_private.ac265_approved_outage_targets as target
  where target.target_id = v_target_id
    and target.target_ref = p_request ->> 'targetRef'
    and substring(target.target_ref from v_target_ref_pattern)::uuid = target.target_id
    and target.environment = 'staging'
    and target.approved_at <= v_now
    and target.expires_at > v_now;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select candidate.*
    into v_candidate
  from platform_private.ac265_verified_candidates as candidate
  where candidate.candidate_id = v_target.candidate_id;

  -- This is deliberately one indistinguishable conflict boundary.  Every
  -- immutable identity edge must agree before any target projection leaves the
  -- private schema: authorization -> target -> candidate -> identity.
  if not found
     or v_target.run_id is distinct from v_authorization.run_id
     or v_target.identity_sha256 is distinct from v_authorization.identity_sha256
     or v_target.source_revision is distinct from v_authorization.source_revision
     or v_target.deployment_id is distinct from v_authorization.deployment_id
     or v_candidate.identity_sha256 is distinct from v_authorization.identity_sha256
     or v_candidate.source_revision is distinct from v_authorization.source_revision
     or v_candidate.deployment_id is distinct from v_authorization.deployment_id
     or v_candidate.identity ->> 'environment' is distinct from 'staging'
     or v_target.environment is distinct from v_candidate.identity ->> 'environment'
     or v_target.hosting_project_id is distinct from v_candidate.identity ->> 'hostingProjectId'
     or v_target.supabase_project_ref is distinct from v_candidate.identity ->> 'supabaseProjectRef' then
    return jsonb_build_object('status', 'conflict');
  end if;

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-approved-outage-target-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_authorization.authorization_id::text,
    'environment', v_target.environment,
    'hostingProjectId', v_target.hosting_project_id,
    'supabaseProjectRef', v_target.supabase_project_ref,
    'redacted', true,
    'targetSha256', encode(v_target.target_sha256, 'hex'),
    'target', jsonb_build_object(
      'schemaVersion', 'ac265-approved-outage-target-v1',
      'source', 'protected-staging-fault-control-plane',
      'targetId', v_target.target_id::text,
      'targetRef', v_target.target_ref,
      'approvedAt', to_char(v_target.approved_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'expiresAt', to_char(v_target.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'scope', jsonb_build_object(
        'runId', v_target.run_id::text,
        'hostingProjectId', v_target.hosting_project_id,
        'supabaseProjectRef', v_target.supabase_project_ref,
        'deploymentId', v_target.deployment_id,
        'dependencyId', v_target.dependency_id,
        'route', jsonb_build_object(
          'operationId', v_target.route_operation_id,
          'method', v_target.route_method,
          'path', v_target.route_path
        )
      )
    )
  );
end;
$function$;

revoke all on function platform_api.ac265_approved_outage_target_read(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_approved_outage_target_read(jsonb)
  to service_role;

comment on function platform_api.ac265_approved_outage_target_read(jsonb) is
  'Reads one redacted, server-correlated AC265 approved outage target only for an unexpired service-role authorization.';
