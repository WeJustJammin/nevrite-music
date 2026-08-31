begin;

-- Restore epochs are a forward-only checkpoint sequence.  Serialize admission
-- so two concurrent callers cannot both validate against the same old maximum
-- and then insert epochs out of order.  Replaying an existing reconciling
-- epoch remains idempotent; a released epoch remains closed to reopening.
create or replace function platform_private.begin_restore_fence(p_restore_epoch bigint, p_reason text)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  current_state platform_private.restore_fence_state;
  current_epoch bigint;
begin
  if p_restore_epoch is null or p_restore_epoch < 1
     or p_reason is null or length(btrim(p_reason)) not between 1 and 500 then
    raise exception 'invalid restore fence' using errcode = '22023';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('platform_private.restore_fences', 0)
  );

  select state
    into current_state
    from platform_private.restore_fences
   where restore_epoch = p_restore_epoch;
  if found then
    return current_state = 'reconciling'::platform_private.restore_fence_state;
  end if;

  select max(restore_epoch)
    into current_epoch
    from platform_private.restore_fences;
  if current_epoch is not null and p_restore_epoch <= current_epoch then
    raise exception 'restore epoch must increase monotonically'
      using errcode = '22023';
  end if;

  insert into platform_private.restore_fences (restore_epoch, reason)
  values (p_restore_epoch, btrim(p_reason));
  return true;
end;
$$;

commit;

-- Rollback policy: forward-only compensating migration. Restore checkpoints
-- are retained for auditability and the monotonic admission contract remains
-- in force after a failed deployment.
