begin;

-- Restore admission is a typed, canonical snapshot.  The latest restore epoch
-- is the epoch producers expect; the latest released epoch is the consumer's
-- checkpoint.  During reconciliation those values intentionally diverge (or
-- the consumer checkpoint is null), which keeps every effect fenced closed.
create or replace function platform_private.read_restore_fence()
returns table (
  expected_epoch bigint,
  consumer_epoch bigint,
  integrity_verified boolean,
  reconciliation_complete boolean
)
language sql stable security definer set search_path = ''
as $$
  with snapshot as (
    select
      max(restore_epoch) as expected_epoch,
      max(restore_epoch) filter (
        where state = 'released'::platform_private.restore_fence_state
      ) as consumer_epoch,
      count(*) filter (
        where state = 'reconciling'::platform_private.restore_fence_state
      ) as active_fences
    from platform_private.restore_fences
  )
  select
    coalesce(expected_epoch, 1::bigint),
    case when expected_epoch is null then 1::bigint else consumer_epoch end,
    active_fences = 0,
    active_fences = 0
  from snapshot;
$$;

-- Keep legacy callers fail-closed while making the typed snapshot the one
-- source of truth for the boolean compatibility gate.
create or replace function platform_private.external_effects_allowed()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select fence.integrity_verified and fence.reconciliation_complete
  from platform_private.read_restore_fence() as fence;
$$;

create or replace function platform_api.read_restore_fence()
returns table (
  expected_epoch bigint,
  consumer_epoch bigint,
  integrity_verified boolean,
  reconciliation_complete boolean
)
language sql stable security definer set search_path = ''
as $$
  select * from platform_private.read_restore_fence();
$$;

revoke all on function platform_private.read_restore_fence() from public, anon, authenticated, service_role;
revoke all on function platform_api.read_restore_fence() from public, anon, authenticated, service_role;
grant execute on function platform_api.read_restore_fence() to service_role;

commit;

-- Rollback policy: forward-only compensating migration.  Restore checkpoints
-- and their admission contract are retained for auditability.
