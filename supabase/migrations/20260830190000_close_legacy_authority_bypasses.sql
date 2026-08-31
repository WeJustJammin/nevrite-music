begin;

-- The target-aware/provider-aware RPCs in 20260830180000 are the only
-- service-role entry points for the S04-S06 command surfaces.  The original
-- RPCs remain callable by their SECURITY DEFINER owners because the new
-- wrappers delegate to them, but no caller role may invoke those functions
-- directly and bypass the additional authority evidence.
revoke all on function platform_private.create_upload_intent(
  uuid, uuid, text, text, text, text, bigint, bytea, text, bigint, text[],
  timestamptz, bytea, bytea, uuid, uuid, uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_api.create_upload_intent(
  uuid, uuid, text, text, text, text, bigint, bytea, text, bigint, text[],
  timestamptz, bytea, bytea, uuid, uuid, uuid
) from public, anon, authenticated, service_role;

revoke all on function platform_private.create_provider_operation(
  text, text, uuid, bytea, bytea, uuid, uuid, uuid, uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_private.record_webhook_receipt(
  text, text, bytea, timestamptz, uuid, uuid, uuid, uuid, uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_private.apply_provider_operation_outcome(
  uuid, bigint, platform_private.provider_operation_state, text, text, boolean,
  timestamptz, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function platform_private.apply_webhook_receipt_outcome(
  uuid, platform_private.webhook_receipt_state,
  platform_private.webhook_receipt_state, uuid, text
) from public, anon, authenticated, service_role;
revoke all on function platform_api.create_provider_operation(
  text, text, uuid, bytea, bytea, uuid, uuid, uuid, uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_api.record_webhook_receipt(
  text, text, bytea, timestamptz, uuid, uuid, uuid, uuid, uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_provider_operation_outcome(
  uuid, bigint, platform_private.provider_operation_state, text, text, boolean,
  timestamptz, timestamptz
) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_webhook_receipt_outcome(
  uuid, platform_private.webhook_receipt_state,
  platform_private.webhook_receipt_state, uuid, text
) from public, anon, authenticated, service_role;

revoke all on function platform_private.complete_upload_intent(
  uuid, uuid, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid,
  uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_api.complete_upload_intent(
  uuid, uuid, uuid, bigint, bigint, text, bytea, text, bytea, bytea, uuid, uuid,
  uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_private.apply_object_verification(
  uuid, bigint, platform_private.object_state, text, uuid, uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_api.apply_object_verification(
  uuid, bigint, platform_private.object_state, text, uuid, uuid
) from public, anon, authenticated, service_role;
revoke all on function platform_private.read_consumable_object(uuid)
  from public, anon, authenticated, service_role;
revoke all on function platform_api.read_consumable_object(uuid)
  from public, anon, authenticated, service_role;

-- A restore epoch is not evidence that its reconciliation completed.  The
-- Free-plan deployment has no independently promoted integrity/reconciliation
-- attestation path, so the legacy epoch-only release operation is unavailable
-- to service_role.  The owner can still use it during disposable local tests;
-- browser roles remain denied by the original grants.
revoke all on function platform_private.complete_restore_fence(bigint)
  from public, anon, authenticated, service_role;
revoke all on function platform_api.complete_restore_fence(bigint)
  from public, anon, authenticated, service_role;

-- Verification must consume the immutable event emitted by upload completion.
-- A caller-supplied job ID is valid only when that job points at the exact
-- object.uploaded/1 event for this object, with the event aggregate and strict
-- objectId payload agreeing.  This closes the unrelated-verification-job path
-- without changing the locked object.uploaded consumer contract.
create or replace function platform_private.apply_object_verification(
  p_object_id uuid,
  p_expected_version bigint,
  p_next_state platform_private.object_state,
  p_error_code text default null,
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_job_id uuid default null
)
returns table (
  object_id uuid,
  version bigint,
  state platform_private.object_state,
  job_id uuid,
  applied boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  object_row platform_private.object_records;
  job_row platform_private.jobs;
  resolved_job_id uuid := p_job_id;
  terminal_error text;
begin
  if not platform_private.external_effects_allowed() then
    raise exception 'restore reconciliation fence is active' using errcode = 'P0001';
  end if;
  if p_object_id is null
     or p_expected_version is null
     or p_expected_version < 1
     or p_next_state not in (
       'verifying'::platform_private.object_state,
       'ready'::platform_private.object_state,
       'rejected'::platform_private.object_state,
       'quarantined'::platform_private.object_state
     )
     or p_correlation_id is null then
    raise exception 'invalid object verification request' using errcode = '22023';
  end if;

  select * into object_row
  from platform_private.object_records
  where id = p_object_id
  for update;
  if not found then
    raise exception 'verification object was not found' using errcode = 'P0001';
  end if;

  -- A terminal replay with no job is a harmless no-op.  When a caller does
  -- provide a job ID, it must still pass the provenance check below.
  if object_row.state not in (
       'ready'::platform_private.object_state,
       'rejected'::platform_private.object_state,
       'quarantined'::platform_private.object_state
     )
     and object_row.version <> p_expected_version then
    raise exception 'verification object version conflict' using errcode = 'P0001';
  end if;

  if resolved_job_id is null then
    select j.id into resolved_job_id
    from platform_private.jobs j
    join platform_private.outbox_events e on e.id = j.originating_event_id
    where j.job_type = 'platform.object.verify'
      and e.event_type = 'object.uploaded'
      and e.schema_version = 1
      and e.aggregate_type = 'object_record'
      and e.aggregate_id = object_row.id
      and e.payload = pg_catalog.jsonb_build_object('objectId', object_row.id)
      and e.correlation_id = j.correlation_id
    order by j.created_at desc, j.id desc
    limit 1;
  end if;
  if resolved_job_id is null then
    raise exception 'verification job was not found' using errcode = 'P0001';
  end if;

  select * into job_row
  from platform_private.jobs
  where id = resolved_job_id
  for update;
  if not found or job_row.job_type <> 'platform.object.verify' then
    raise exception 'verification job was not found' using errcode = 'P0001';
  end if;

  perform 1
  from platform_private.outbox_events
  where id = job_row.originating_event_id
    and event_type = 'object.uploaded'
    and schema_version = 1
    and aggregate_type = 'object_record'
    and aggregate_id = object_row.id
    and payload = pg_catalog.jsonb_build_object('objectId', object_row.id)
    and correlation_id = job_row.correlation_id;
  if not found then
    raise exception 'verification job is not bound to the object upload event'
      using errcode = 'P0001';
  end if;

  if object_row.state in (
       'ready'::platform_private.object_state,
       'rejected'::platform_private.object_state,
       'quarantined'::platform_private.object_state
     ) then
    object_id := object_row.id;
    version := object_row.version;
    state := object_row.state;
    job_id := job_row.id;
    applied := false;
    return next;
    return;
  end if;

  if p_next_state = 'verifying'::platform_private.object_state then
    if object_row.state <> 'uploaded'::platform_private.object_state
       or job_row.state not in ('queued'::platform_private.job_state, 'running'::platform_private.job_state) then
      raise exception 'verification start state conflict' using errcode = 'P0001';
    end if;
    update platform_private.object_records as o
    set state = 'verifying'::platform_private.object_state,
        version = o.version + 1
    where o.id = object_row.id
      and o.state = 'uploaded'::platform_private.object_state
      and o.version = p_expected_version;
    if not found then
      raise exception 'verification start CAS conflict' using errcode = 'P0001';
    end if;
    if job_row.state = 'queued'::platform_private.job_state then
      update platform_private.jobs as j
      set state = 'running'::platform_private.job_state,
          attempt_count = j.attempt_count + 1,
          lease_until = now_at + interval '2 minutes',
          lease_token = extensions.gen_random_uuid(),
          updated_at = now_at,
          version = j.version + 1
      where j.id = job_row.id and j.state = 'queued'::platform_private.job_state;
      if not found then
        raise exception 'verification job start CAS conflict' using errcode = 'P0001';
      end if;
    end if;
    insert into audit_private.audit_events (
      action, actor_id, acting_party_id, target_type, target_id, decision,
      reason_code, correlation_id, occurred_at
    ) values (
      'object.verification.started', job_row.actor_id, job_row.acting_party_id,
      'object_record', object_row.id, 'allowed', 'OBJECT_VERIFICATION_STARTED',
      p_correlation_id, now_at
    );
    select o.version, o.state into version, state
    from platform_private.object_records as o where o.id = object_row.id;
    object_id := object_row.id;
    job_id := job_row.id;
    applied := true;
    return next;
    return;
  end if;

  if object_row.state <> 'verifying'::platform_private.object_state
     or job_row.state <> 'running'::platform_private.job_state then
    raise exception 'verification terminal state conflict' using errcode = 'P0001';
  end if;
  if p_next_state = 'ready'::platform_private.object_state then
    if p_error_code is not null
       or object_row.observed_byte_size is null
       or object_row.observed_media_type is null
       or object_row.observed_checksum is null
       or object_row.observed_byte_size <> object_row.byte_size
       or object_row.observed_media_type <> object_row.media_type
       or object_row.observed_checksum <> object_row.checksum then
      raise exception 'provider-observed metadata failed verification' using errcode = 'P0001';
    end if;
  else
    terminal_error := coalesce(
      p_error_code,
      case when p_next_state = 'quarantined'::platform_private.object_state
           then 'OBJECT_QUARANTINED' else 'OBJECT_VERIFICATION_FAILED' end
    );
    if terminal_error !~ '^[A-Z][A-Z0-9_.-]{0,63}$' then
      raise exception 'invalid verification error code' using errcode = '22023';
    end if;
  end if;

  update platform_private.object_records as o
  set state = p_next_state,
      version = o.version + 1
  where o.id = object_row.id
    and o.state = 'verifying'::platform_private.object_state
    and o.version = p_expected_version;
  if not found then
    raise exception 'verification terminal CAS conflict' using errcode = 'P0001';
  end if;

  if p_next_state = 'ready'::platform_private.object_state then
    update platform_private.jobs as j
    set state = 'succeeded'::platform_private.job_state,
        result_ref = pg_catalog.jsonb_build_object('type', 'object_record', 'id', object_row.id),
        error_code = null,
        lease_until = null,
        lease_token = null,
        updated_at = now_at,
        version = j.version + 1
    where j.id = job_row.id and j.state = 'running'::platform_private.job_state;
  else
    update platform_private.jobs as j
    set state = 'failed'::platform_private.job_state,
        result_ref = null,
        error_code = terminal_error,
        lease_until = null,
        lease_token = null,
        updated_at = now_at,
        version = j.version + 1
    where j.id = job_row.id and j.state = 'running'::platform_private.job_state;
  end if;
  if not found then
    raise exception 'verification job terminal CAS conflict' using errcode = 'P0001';
  end if;

  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    case when p_next_state = 'ready'::platform_private.object_state
         then 'object.verification.completed'
         when p_next_state = 'quarantined'::platform_private.object_state
         then 'object.verification.quarantined'
         else 'object.verification.rejected' end,
    job_row.actor_id, job_row.acting_party_id, 'object_record', object_row.id,
    case when p_next_state = 'ready'::platform_private.object_state
         then 'completed'::platform_private.audit_decision
         else 'failed'::platform_private.audit_decision end,
    case when p_next_state = 'ready'::platform_private.object_state
         then 'OBJECT_READY' else terminal_error end,
    p_correlation_id, now_at
  );

  select o.version, o.state into version, state
  from platform_private.object_records as o where o.id = object_row.id;
  object_id := object_row.id;
  job_id := job_row.id;
  applied := true;
  return next;
end;
$$;

commit;

-- Rollback policy: forward-only compensating migration. Legacy ACLs remain
-- revoked and immutable event/evidence records are never rewritten.
