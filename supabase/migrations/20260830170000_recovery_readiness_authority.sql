begin;

-- Recovery evidence is append-only.  A row is a point-in-time statement of
-- what was verified for one restore epoch; it is never a mutable health flag.
create table platform_private.recovery_verification_evidence (
  id uuid primary key default extensions.gen_random_uuid(),
  restore_epoch bigint not null check (restore_epoch > 0),
  pitr_supported boolean not null,
  pitr_window_seconds bigint check (pitr_window_seconds is null or pitr_window_seconds >= 0),
  measured_rpo_seconds bigint check (measured_rpo_seconds is null or measured_rpo_seconds >= 0),
  measured_rto_seconds bigint check (measured_rto_seconds is null or measured_rto_seconds >= 0),
  verified_at timestamptz not null default clock_timestamp(),
  expires_at timestamptz not null,
  integrity_verified boolean not null,
  rls_verified boolean not null,
  rpc_verified boolean not null,
  idempotency_outbox_job_verified boolean not null,
  object_verified boolean not null,
  provider_webhook_verified boolean not null,
  public_projection_verified boolean not null,
  created_at timestamptz not null default clock_timestamp(),
  check (expires_at > verified_at),
  check (
    pitr_supported
    or (pitr_window_seconds is null and measured_rpo_seconds is null and measured_rto_seconds is null)
  )
);

comment on table platform_private.recovery_verification_evidence is
  'Immutable recovery/PITR evidence. A failed or missing row keeps protected writes closed.';
comment on column platform_private.recovery_verification_evidence.pitr_supported is
  'Whether the required seven-day PITR capability was actually verified; baseline is false on unsupported tiers.';
comment on column platform_private.recovery_verification_evidence.measured_rpo_seconds is
  'Measured RPO in seconds; null means no measurement was claimed.';
comment on column platform_private.recovery_verification_evidence.measured_rto_seconds is
  'Measured RTO in seconds; null means no measurement was claimed.';

alter table platform_private.recovery_verification_evidence enable row level security;
alter table platform_private.recovery_verification_evidence force row level security;

revoke all on table platform_private.recovery_verification_evidence
from public, anon, authenticated, service_role;
grant usage on schema platform_private to service_role;

create index recovery_verification_latest_idx
  on platform_private.recovery_verification_evidence (verified_at desc, created_at desc, id desc);
create index recovery_verification_epoch_idx
  on platform_private.recovery_verification_evidence (restore_epoch, verified_at desc, id desc);

create function platform_private.guard_recovery_verification_evidence() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'recovery verification evidence is append-only' using errcode = 'P0001';
end;
$$;

create trigger recovery_verification_evidence_append_only
before update or delete on platform_private.recovery_verification_evidence
for each row execute function platform_private.guard_recovery_verification_evidence();

-- The current local/free-tier baseline deliberately says that seven-day PITR
-- is unavailable.  RPO/RTO are NULL because no measurement was made.
insert into platform_private.recovery_verification_evidence (
  id, restore_epoch, pitr_supported, pitr_window_seconds,
  measured_rpo_seconds, measured_rto_seconds, verified_at, expires_at,
  integrity_verified, rls_verified, rpc_verified,
  idempotency_outbox_job_verified, object_verified,
  provider_webhook_verified, public_projection_verified, created_at
) values (
  '00000000-0000-0000-0000-00000000a701'::uuid,
  1,
  false,
  null,
  null,
  null,
  clock_timestamp() - interval '2 days',
  clock_timestamp() - interval '1 second',
  false,
  false,
  false,
  false,
  false,
  false,
  false,
  clock_timestamp()
);

insert into audit_private.audit_events (
  action, actor_id, acting_party_id, target_type, target_id, decision,
  reason_code, correlation_id, occurred_at
) values (
  'recovery.verification.recorded',
  null,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'recovery_verification',
  '00000000-0000-0000-0000-00000000a701'::uuid,
  'failed'::platform_private.audit_decision,
  'PITR_UNAVAILABLE',
  '00000000-0000-0000-0000-00000000a702'::uuid,
  clock_timestamp()
);

create function platform_private.protected_writes_allowed()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_restore_epoch bigint;
  consumer_restore_epoch bigint;
  fence_integrity_verified boolean;
  fence_reconciliation_complete boolean;
  evidence_row platform_private.recovery_verification_evidence;
  now_at timestamptz := clock_timestamp();
begin
  -- Existing external-effect fencing remains authoritative during restore.
  if not platform_private.external_effects_allowed() then
    return false;
  end if;

  select expected_epoch, consumer_epoch, integrity_verified, reconciliation_complete
    into current_restore_epoch, consumer_restore_epoch,
         fence_integrity_verified, fence_reconciliation_complete
  from platform_private.read_restore_fence();
  if current_restore_epoch is null
     or consumer_restore_epoch is distinct from current_restore_epoch
     or not coalesce(fence_integrity_verified, false)
     or not coalesce(fence_reconciliation_complete, false) then
    return false;
  end if;

  -- Always evaluate the newest evidence.  A failed/stale row must not fall
  -- back to an older success and accidentally reopen protected writes.
  select * into evidence_row
  from platform_private.recovery_verification_evidence
  order by verified_at desc, created_at desc, id desc
  limit 1;
  if not found then
    return false;
  end if;

  return evidence_row.restore_epoch = current_restore_epoch
    and evidence_row.pitr_supported
    and evidence_row.pitr_window_seconds is not null
    and evidence_row.pitr_window_seconds >= 604800
    and evidence_row.measured_rpo_seconds is not null
    and evidence_row.measured_rpo_seconds <= 120
    and evidence_row.measured_rto_seconds is not null
    and evidence_row.measured_rto_seconds <= 14400
    and evidence_row.verified_at <= now_at
    and evidence_row.expires_at > now_at
    and evidence_row.integrity_verified
    and evidence_row.rls_verified
    and evidence_row.rpc_verified
    and evidence_row.idempotency_outbox_job_verified
    and evidence_row.object_verified
    and evidence_row.provider_webhook_verified
    and evidence_row.public_projection_verified;
end;
$$;

-- Named runbook writer.  It can append evidence, but can never rewrite a
-- prior result.  Unsupported PITR cannot carry invented RPO/RTO measurements.
create function platform_private.record_recovery_verification(
  p_restore_epoch bigint,
  p_pitr_supported boolean,
  p_pitr_window_seconds bigint,
  p_measured_rpo_seconds bigint,
  p_measured_rto_seconds bigint,
  p_integrity_verified boolean,
  p_rls_verified boolean,
  p_rpc_verified boolean,
  p_idempotency_outbox_job_verified boolean,
  p_object_verified boolean,
  p_provider_webhook_verified boolean,
  p_public_projection_verified boolean,
  p_verified_at timestamptz default clock_timestamp(),
  p_expires_at timestamptz default (clock_timestamp() + interval '24 hours'),
  p_evidence_id uuid default extensions.gen_random_uuid(),
  p_correlation_id uuid default extensions.gen_random_uuid(),
  p_actor_id uuid default null,
  p_acting_party_id uuid default '00000000-0000-0000-0000-000000000001'::uuid
)
returns table (evidence_id uuid, protected_writes_allowed boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  now_at timestamptz := clock_timestamp();
  evidence_decision platform_private.audit_decision;
  evidence_reason text;
begin
  if p_restore_epoch is null
     or p_restore_epoch < 1
     or p_pitr_supported is null
     or (not p_pitr_supported and (
       p_pitr_window_seconds is not null
       or p_measured_rpo_seconds is not null
       or p_measured_rto_seconds is not null
     ))
     or (p_pitr_window_seconds is not null and p_pitr_window_seconds < 0)
     or (p_measured_rpo_seconds is not null and p_measured_rpo_seconds < 0)
     or (p_measured_rto_seconds is not null and p_measured_rto_seconds < 0)
     or p_integrity_verified is null
     or p_rls_verified is null
     or p_rpc_verified is null
     or p_idempotency_outbox_job_verified is null
     or p_object_verified is null
     or p_provider_webhook_verified is null
     or p_public_projection_verified is null
     or p_verified_at is null
     or p_expires_at is null
     or p_verified_at > now_at
     or p_expires_at <= p_verified_at
     or p_evidence_id is null
     or p_correlation_id is null
     or p_acting_party_id is null then
    raise exception 'invalid recovery verification evidence' using errcode = '22023';
  end if;
  if p_pitr_supported
     and (p_pitr_window_seconds is null
       or p_measured_rpo_seconds is null
       or p_measured_rto_seconds is null) then
    raise exception 'supported PITR evidence requires RPO and RTO measurements' using errcode = '22023';
  end if;

  insert into platform_private.recovery_verification_evidence (
    id, restore_epoch, pitr_supported, pitr_window_seconds,
    measured_rpo_seconds, measured_rto_seconds, verified_at, expires_at,
    integrity_verified, rls_verified, rpc_verified,
    idempotency_outbox_job_verified, object_verified,
    provider_webhook_verified, public_projection_verified, created_at
  ) values (
    p_evidence_id, p_restore_epoch, p_pitr_supported, p_pitr_window_seconds,
    p_measured_rpo_seconds, p_measured_rto_seconds, p_verified_at, p_expires_at,
    p_integrity_verified, p_rls_verified, p_rpc_verified,
    p_idempotency_outbox_job_verified, p_object_verified,
    p_provider_webhook_verified, p_public_projection_verified, now_at
  );

  if p_pitr_supported
     and p_pitr_window_seconds >= 604800
     and p_measured_rpo_seconds <= 120
     and p_measured_rto_seconds <= 14400
     and p_integrity_verified
     and p_rls_verified
     and p_rpc_verified
     and p_idempotency_outbox_job_verified
     and p_object_verified
     and p_provider_webhook_verified
     and p_public_projection_verified then
    evidence_decision := 'completed'::platform_private.audit_decision;
    evidence_reason := 'RECOVERY_VERIFICATION_RECORDED';
  else
    evidence_decision := 'failed'::platform_private.audit_decision;
    evidence_reason := case when not p_pitr_supported then 'PITR_UNAVAILABLE' else 'RECOVERY_VERIFICATION_FAILED' end;
  end if;
  insert into audit_private.audit_events (
    action, actor_id, acting_party_id, target_type, target_id, decision,
    reason_code, correlation_id, occurred_at
  ) values (
    'recovery.verification.recorded', p_actor_id, p_acting_party_id,
    'recovery_verification', p_evidence_id, evidence_decision,
    evidence_reason, p_correlation_id, now_at
  );

  evidence_id := p_evidence_id;
  protected_writes_allowed := platform_private.protected_writes_allowed();
  return next;
end;
$$;

create function platform_private.read_recovery_verification()
returns table (
  evidence_present boolean,
  evidence_id uuid,
  current_restore_epoch bigint,
  consumer_restore_epoch bigint,
  restore_epoch bigint,
  pitr_supported boolean,
  pitr_window_seconds bigint,
  measured_rpo_seconds bigint,
  measured_rto_seconds bigint,
  verified_at timestamptz,
  expires_at timestamptz,
  integrity_verified boolean,
  rls_verified boolean,
  rpc_verified boolean,
  idempotency_outbox_job_verified boolean,
  object_verified boolean,
  provider_webhook_verified boolean,
  public_projection_verified boolean,
  pitr_status text,
  pitr_available boolean,
  protected_writes_allowed boolean,
  reason_code text
)
language sql
security definer
set search_path = ''
as $$
  with fence as (
    select expected_epoch, consumer_epoch, integrity_verified, reconciliation_complete
    from platform_private.read_restore_fence()
  ),
  latest as (
    select e.*
    from platform_private.recovery_verification_evidence e
    order by e.verified_at desc, e.created_at desc, e.id desc
    limit 1
  ),
  gate as (
    select platform_private.protected_writes_allowed() as allowed
  )
  select
    latest.id is not null,
    latest.id,
    fence.expected_epoch,
    fence.consumer_epoch,
    latest.restore_epoch,
    latest.pitr_supported,
    latest.pitr_window_seconds,
    latest.measured_rpo_seconds,
    latest.measured_rto_seconds,
    latest.verified_at,
    latest.expires_at,
    latest.integrity_verified,
    latest.rls_verified,
    latest.rpc_verified,
    latest.idempotency_outbox_job_verified,
    latest.object_verified,
    latest.provider_webhook_verified,
    latest.public_projection_verified,
    case when latest.pitr_supported
       and latest.pitr_window_seconds >= 604800
       then 'available' else 'unavailable' end,
    latest.pitr_supported
      and latest.pitr_window_seconds >= 604800,
    gate.allowed,
    case
      when latest.id is null then 'RECOVERY_EVIDENCE_MISSING'
      when not latest.pitr_supported
        or latest.pitr_window_seconds is null
        or latest.pitr_window_seconds < 604800 then 'PITR_UNAVAILABLE'
      when latest.measured_rpo_seconds is null
        or latest.measured_rto_seconds is null
        or latest.measured_rpo_seconds > 120
        or latest.measured_rto_seconds > 14400 then 'RECOVERY_METRICS_UNVERIFIED'
      when latest.verified_at > clock_timestamp()
        or latest.expires_at <= clock_timestamp() then 'RECOVERY_EVIDENCE_STALE'
      when latest.restore_epoch is distinct from fence.expected_epoch
        or fence.consumer_epoch is distinct from fence.expected_epoch then 'RESTORE_EPOCH_MISMATCH'
      when not coalesce(fence.integrity_verified, false)
        or not coalesce(fence.reconciliation_complete, false) then 'RESTORE_RECONCILIATION_INCOMPLETE'
      when not latest.integrity_verified then 'INTEGRITY_CHECK_FAILED'
      when not latest.rls_verified then 'RLS_CHECK_FAILED'
      when not latest.rpc_verified then 'RPC_CHECK_FAILED'
      when not latest.idempotency_outbox_job_verified then 'PERSISTENCE_CHECK_FAILED'
      when not latest.object_verified then 'OBJECT_CHECK_FAILED'
      when not latest.provider_webhook_verified then 'PROVIDER_WEBHOOK_CHECK_FAILED'
      when not latest.public_projection_verified then 'PUBLIC_PROJECTION_CHECK_FAILED'
      else 'RECOVERY_VERIFIED'
    end
  from fence
  cross join gate
  left join latest on true;
$$;

create function platform_api.read_recovery_verification()
returns table (
  evidence_present boolean,
  evidence_id uuid,
  current_restore_epoch bigint,
  consumer_restore_epoch bigint,
  restore_epoch bigint,
  pitr_supported boolean,
  pitr_window_seconds bigint,
  measured_rpo_seconds bigint,
  measured_rto_seconds bigint,
  verified_at timestamptz,
  expires_at timestamptz,
  integrity_verified boolean,
  rls_verified boolean,
  rpc_verified boolean,
  idempotency_outbox_job_verified boolean,
  object_verified boolean,
  provider_webhook_verified boolean,
  public_projection_verified boolean,
  pitr_status text,
  pitr_available boolean,
  protected_writes_allowed boolean,
  reason_code text
)
language sql
stable
security definer
set search_path = ''
as $$
  select * from platform_private.read_recovery_verification();
$$;

create function platform_api.protected_writes_allowed()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select platform_private.protected_writes_allowed();
$$;

revoke all on function platform_private.protected_writes_allowed() from public, anon, authenticated, service_role;
revoke all on function platform_private.read_recovery_verification() from public, anon, authenticated, service_role;
revoke all on function platform_private.record_recovery_verification(bigint, boolean, bigint, bigint, bigint, boolean, boolean, boolean, boolean, boolean, boolean, boolean, timestamptz, timestamptz, uuid, uuid, uuid, uuid)
  from public, anon, authenticated;
grant execute on function platform_private.protected_writes_allowed() to service_role;
grant execute on function platform_private.read_recovery_verification() to service_role;
grant execute on function platform_private.record_recovery_verification(bigint, boolean, bigint, bigint, bigint, boolean, boolean, boolean, boolean, boolean, boolean, boolean, timestamptz, timestamptz, uuid, uuid, uuid, uuid) to service_role;

revoke all on function platform_api.read_recovery_verification() from public, anon, authenticated, service_role;
revoke all on function platform_api.protected_writes_allowed() from public, anon, authenticated, service_role;
grant execute on function platform_api.read_recovery_verification() to service_role;
grant execute on function platform_api.protected_writes_allowed() to service_role;

commit;

-- Rollback policy: forward-only compensating migration.  Recovery evidence and
-- its audit trail remain immutable across failed promotion or restore work.
