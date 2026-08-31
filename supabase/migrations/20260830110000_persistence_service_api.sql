begin;

create or replace function platform_api.accept_job_with_outbox(
  p_actor_id uuid, p_acting_party_id uuid, p_job_type text, p_correlation_id uuid,
  p_idempotency_key_hash bytea, p_request_hash bytea, p_expires_at timestamptz,
  p_job_id uuid default extensions.gen_random_uuid(), p_event_id uuid default extensions.gen_random_uuid()
)
returns table (job_id uuid, event_id uuid, version bigint, replayed boolean)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_actor_id is null or p_acting_party_id is null or p_correlation_id is null or p_job_type is null
     or p_job_id is null or p_event_id is null or p_idempotency_key_hash is null or p_request_hash is null
     or octet_length(p_idempotency_key_hash) <> 32 or octet_length(p_request_hash) <> 32
     or p_expires_at is null or p_expires_at <= clock_timestamp()
     or p_expires_at > clock_timestamp() + interval '30 days'
     or btrim(p_job_type) <> p_job_type or length(p_job_type) not between 1 and 128
     or p_job_type !~ '^[a-z0-9][a-z0-9._-]*$' then
    raise exception 'invalid job acceptance adapter input' using errcode = '22023';
  end if;
  return query
    select * from platform_private.accept_job_with_outbox(
      p_actor_id, p_acting_party_id, p_job_type, p_correlation_id,
      p_idempotency_key_hash, p_request_hash, p_expires_at, p_job_id, p_event_id
    ) limit 1;
end;
$$;
create or replace function platform_api.claim_outbox_event(p_event_id uuid, p_lease_token uuid, p_lease_seconds integer)
returns table (event_id uuid, aggregate_id uuid, aggregate_version bigint, lease_token uuid, dispatch_attempt_count integer)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_event_id is null or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_seconds is null or p_lease_seconds not between 1 and 840 then
    raise exception 'invalid outbox lease adapter input' using errcode = '22023';
  end if;
  return query
    select * from platform_private.claim_outbox_event(p_event_id, p_lease_token, p_lease_seconds) limit 1;
end;
$$;
create or replace function platform_api.complete_outbox_event(p_event_id uuid, p_lease_token uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_event_id is null or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'invalid outbox completion adapter input' using errcode = '22023';
  end if;
  return platform_private.complete_outbox_event(p_event_id, p_lease_token);
end;
$$;
create or replace function platform_api.dead_letter_unknown_outbox_event(p_event_id uuid, p_lease_token uuid)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_event_id is null or p_lease_token is null
     or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid then
    raise exception 'invalid outbox dead-letter adapter input' using errcode = '22023';
  end if;
  return platform_private.dead_letter_unknown_outbox_event(p_event_id, p_lease_token);
end;
$$;
create or replace function platform_api.claim_job(p_job_id uuid, p_expected_version bigint, p_lease_token uuid, p_lease_seconds integer)
returns table (job_id uuid, version bigint, state platform_private.job_state, lease_until timestamptz, attempt_count integer)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1
     or p_lease_token is null or p_lease_token = '00000000-0000-0000-0000-000000000000'::uuid
     or p_lease_seconds is null or p_lease_seconds not between 1 and 840 then
    raise exception 'invalid job lease adapter input' using errcode = '22023';
  end if;
  return query
    select * from platform_private.claim_job(p_job_id, p_expected_version, p_lease_token, p_lease_seconds) limit 1;
end;
$$;
create or replace function platform_api.apply_job_outcome(
  p_job_id uuid, p_expected_version bigint, p_next_state platform_private.job_state,
  p_result_ref jsonb, p_error_code text, p_retryable boolean
)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_job_id is null or p_expected_version is null or p_expected_version < 1 or p_next_state is null
     or p_retryable is null or (p_result_ref is not null and pg_column_size(p_result_ref) > 65536)
     or p_error_code is not null and p_error_code !~ '^[A-Z][A-Z0-9_.-]{0,63}$' then
    raise exception 'invalid job outcome adapter input' using errcode = '22023';
  end if;
  return platform_private.apply_job_outcome(
    p_job_id, p_expected_version, p_next_state, p_result_ref, p_error_code, p_retryable
  );
end;
$$;
create or replace function platform_api.begin_restore_fence(p_restore_epoch bigint, p_reason text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_restore_epoch is null or p_restore_epoch < 1 or p_reason is null
     or length(btrim(p_reason)) not between 1 and 500 then
    raise exception 'invalid restore fence adapter input' using errcode = '22023';
  end if;
  return platform_private.begin_restore_fence(p_restore_epoch, p_reason);
end;
$$;
create or replace function platform_api.complete_restore_fence(p_restore_epoch bigint)
returns boolean
language plpgsql security definer set search_path = ''
as $$
begin
  if p_restore_epoch is null or p_restore_epoch < 1 then
    raise exception 'invalid restore completion adapter input' using errcode = '22023';
  end if;
  return platform_private.complete_restore_fence(p_restore_epoch);
end;
$$;

create or replace function platform_api.external_effects_allowed()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select platform_private.external_effects_allowed();
$$;

revoke all on function platform_api.accept_job_with_outbox(uuid, uuid, text, uuid, bytea, bytea, timestamptz, uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.claim_outbox_event(uuid, uuid, integer) from public, anon, authenticated, service_role;
revoke all on function platform_api.complete_outbox_event(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.dead_letter_unknown_outbox_event(uuid, uuid) from public, anon, authenticated, service_role;
revoke all on function platform_api.claim_job(uuid, bigint, uuid, integer) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_job_outcome(uuid, bigint, platform_private.job_state, jsonb, text, boolean) from public, anon, authenticated, service_role;
revoke all on function platform_api.begin_restore_fence(bigint, text) from public, anon, authenticated, service_role;
revoke all on function platform_api.complete_restore_fence(bigint) from public, anon, authenticated, service_role;
revoke all on function platform_api.external_effects_allowed() from public, anon, authenticated, service_role;
grant execute on function platform_api.accept_job_with_outbox(uuid, uuid, text, uuid, bytea, bytea, timestamptz, uuid, uuid) to service_role;
grant execute on function platform_api.claim_outbox_event(uuid, uuid, integer) to service_role;
grant execute on function platform_api.complete_outbox_event(uuid, uuid) to service_role;
grant execute on function platform_api.dead_letter_unknown_outbox_event(uuid, uuid) to service_role;
grant execute on function platform_api.claim_job(uuid, bigint, uuid, integer) to service_role;
grant execute on function platform_api.apply_job_outcome(uuid, bigint, platform_private.job_state, jsonb, text, boolean) to service_role;
grant execute on function platform_api.begin_restore_fence(bigint, text) to service_role;
grant execute on function platform_api.complete_restore_fence(bigint) to service_role;
grant execute on function platform_api.external_effects_allowed() to service_role;
commit;

-- Rollback policy: forward-only compensating migration. Adapter names and
-- grants remain stable; removal requires a reviewed replacement migration.
