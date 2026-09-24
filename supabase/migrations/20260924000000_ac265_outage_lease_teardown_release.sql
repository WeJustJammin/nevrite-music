-- AC265 CP-01 forward fix: make bounded runner teardown possible.
--
-- The original control plane required a consume before any release. A lease
-- that a runner acquired but abandoned before consuming therefore stayed
-- unreleasable, and because the one-active-lease index only clears on release,
-- the authorization/target binding stayed wedged for every later attempt. The
-- runner contract's first bounded teardown action is releasing the one-use
-- outage lease, so that path must exist.
--
-- This migration keeps the promoted acquire/consume/release RPC shapes and the
-- strict request validation, and changes exactly two lifecycle rules:
--   1. release no longer requires a prior consume (teardown of an abandoned
--      lease), while consumption state is preserved when it exists;
--   2. consume rejects an already released lease, so a released capability can
--      never inject a request afterwards.

alter table platform_private.ac265_hosted_outage_leases
  drop constraint ac265_hosted_outage_leases_released_fields;

alter table platform_private.ac265_hosted_outage_leases
  add constraint ac265_hosted_outage_leases_released_fields
    check (
      (released_at is null and released_idempotency_ref is null and release_request_sha256 is null)
      or (
        released_at is not null
        and released_idempotency_ref is not null
        and release_request_sha256 is not null
        and released_at >= acquired_at
        and released_at < expires_at
        and (
          consumed_at is null
          or (released_at >= consumed_at and consumed_at < expires_at)
        )
      )
    );

create or replace function platform_api.ac265_hosted_outage_lease_consume(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
    'idempotencyRef', 'leaseRef', 'leaseSha256'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_target_ref_pattern constant text :=
    '^ac265-outage-target://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_lease_ref_pattern constant text :=
    '^ac265-lease://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_target_id uuid;
  v_lease_id uuid;
  v_now timestamptz;
  v_request_sha256 bytea;
  v_expected_lease_sha256 text;
  v_lease platform_private.ac265_hosted_outage_leases%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'targetRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseSha256') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-outage-lease-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'targetRef', '') !~ v_target_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or coalesce(p_request ->> 'leaseRef', '') !~ v_lease_ref_pattern
     or coalesce(p_request ->> 'leaseSha256', '') !~ '^[0-9a-f]{64}$' then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
    v_target_id := substring(p_request ->> 'targetRef' from v_target_ref_pattern)::uuid;
    v_lease_id := substring(p_request ->> 'leaseRef' from v_lease_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end;

  v_expected_lease_sha256 := encode(
    extensions.digest(convert_to(p_request ->> 'leaseRef', 'utf8'), 'sha256'),
    'hex'
  );
  if p_request ->> 'leaseSha256' <> v_expected_lease_sha256 then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;
  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.lease_id = v_lease_id
  for update;

  if not found
     or v_lease.lease_ref <> p_request ->> 'leaseRef'
     or v_lease.authorization_id <> v_authorization_id
     or v_lease.target_id <> v_target_id then
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.lease_sha256 is distinct from extensions.digest(
       convert_to(v_lease.lease_ref, 'utf8'), 'sha256'
     ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  -- A released lease is spent.  Refuse before the replay branch so a released
  -- capability can never be replayed into a consume grant.
  if v_lease.released_at is not null then
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.consumed_at is not null then
    if v_lease.consume_request_sha256 = v_request_sha256 then
      return jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
        'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
        'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
        'idempotencyRef', v_lease.consumed_idempotency_ref,
        'leaseRef', v_lease.lease_ref,
        'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
        'environment', v_lease.environment,
        'state', 'consumed',
        'requestLimit', v_lease.request_limit,
        'consumedAt', to_char(v_lease.consumed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'redacted', true
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  v_now := clock_timestamp();
  if v_lease.expires_at <= v_now then
    return jsonb_build_object('status', 'conflict');
  end if;

  update platform_private.ac265_hosted_outage_leases
  set consumed_at = v_now,
      consumed_idempotency_ref = p_request ->> 'idempotencyRef',
      consume_request_sha256 = v_request_sha256
  where lease_id = v_lease.lease_id;

  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.lease_id = v_lease_id;

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
    'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
    'idempotencyRef', v_lease.consumed_idempotency_ref,
    'leaseRef', v_lease.lease_ref,
    'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
    'environment', v_lease.environment,
    'state', 'consumed',
    'requestLimit', v_lease.request_limit,
    'consumedAt', to_char(v_lease.consumed_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'redacted', true
  );
end;
$function$;

revoke all on function platform_api.ac265_hosted_outage_lease_consume(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_hosted_outage_lease_consume(jsonb)
  to service_role;

create or replace function platform_api.ac265_hosted_outage_lease_release(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'targetRef',
    'idempotencyRef', 'leaseRef', 'leaseSha256'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_target_ref_pattern constant text :=
    '^ac265-outage-target://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_lease_ref_pattern constant text :=
    '^ac265-lease://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_target_id uuid;
  v_lease_id uuid;
  v_now timestamptz;
  v_request_sha256 bytea;
  v_expected_lease_sha256 text;
  v_lease platform_private.ac265_hosted_outage_leases%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'targetRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'leaseSha256') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '') <> 'ac265-hosted-outage-lease-control-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'targetRef', '') !~ v_target_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or coalesce(p_request ->> 'leaseRef', '') !~ v_lease_ref_pattern
     or coalesce(p_request ->> 'leaseSha256', '') !~ '^[0-9a-f]{64}$' then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(p_request ->> 'authorizationRef' from v_authorization_ref_pattern)::uuid;
    v_target_id := substring(p_request ->> 'targetRef' from v_target_ref_pattern)::uuid;
    v_lease_id := substring(p_request ->> 'leaseRef' from v_lease_ref_pattern)::uuid;
  exception when others then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end;

  v_expected_lease_sha256 := encode(
    extensions.digest(convert_to(p_request ->> 'leaseRef', 'utf8'), 'sha256'),
    'hex'
  );
  if p_request ->> 'leaseSha256' <> v_expected_lease_sha256 then
    raise exception 'AC265 outage lease request rejected' using errcode = '22023';
  end if;
  v_request_sha256 := extensions.digest(convert_to(p_request::text, 'utf8'), 'sha256');

  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.lease_id = v_lease_id
  for update;

  if not found
     or v_lease.lease_ref <> p_request ->> 'leaseRef'
     or v_lease.authorization_id <> v_authorization_id
     or v_lease.target_id <> v_target_id then
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.lease_sha256 is distinct from extensions.digest(
       convert_to(v_lease.lease_ref, 'utf8'), 'sha256'
     ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  if v_lease.released_at is not null then
    if v_lease.release_request_sha256 = v_request_sha256 then
      return jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
        'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
        'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
        'idempotencyRef', v_lease.released_idempotency_ref,
        'leaseRef', v_lease.lease_ref,
        'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
        'environment', v_lease.environment,
        'state', 'released',
        'releasedAt', to_char(v_lease.released_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'redacted', true
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  -- Releasing inside the lease window is what clears the active-lease slot so
  -- the binding stays usable.  A lease that is already past expiry cannot be
  -- released, and a released lease never records consumption.
  v_now := clock_timestamp();
  if v_lease.expires_at <= v_now then
    return jsonb_build_object('status', 'conflict');
  end if;

  update platform_private.ac265_hosted_outage_leases
  set released_at = v_now,
      released_idempotency_ref = p_request ->> 'idempotencyRef',
      release_request_sha256 = v_request_sha256
  where lease_id = v_lease.lease_id;

  select l.*
    into v_lease
  from platform_private.ac265_hosted_outage_leases as l
  where l.lease_id = v_lease_id;

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-outage-lease-control-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_lease.authorization_id::text,
    'targetRef', 'ac265-outage-target://staging/' || v_lease.target_id::text,
    'idempotencyRef', v_lease.released_idempotency_ref,
    'leaseRef', v_lease.lease_ref,
    'leaseSha256', encode(v_lease.lease_sha256, 'hex'),
    'environment', v_lease.environment,
    'state', 'released',
    'releasedAt', to_char(v_lease.released_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'redacted', true
  );
end;
$function$;

revoke all on function platform_api.ac265_hosted_outage_lease_release(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_hosted_outage_lease_release(jsonb)
  to service_role;

comment on function platform_api.ac265_hosted_outage_lease_consume(jsonb) is
  'Consumes an AC265 lease exactly once inside its window; a released lease is spent and always conflicts.';
comment on function platform_api.ac265_hosted_outage_lease_release(jsonb) is
  'Releases an AC265 lease inside its window, with or without a prior consume, so bounded teardown can clear the active-lease slot; replay is exact-request bound.';
