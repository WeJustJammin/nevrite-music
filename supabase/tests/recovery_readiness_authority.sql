begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select has_table(
  'platform_private',
  'recovery_verification_evidence',
  'recovery verification evidence table exists in the private schema'
);
select ok(
  (select relrowsecurity and relforcerowsecurity
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'platform_private'
     and c.relname = 'recovery_verification_evidence'),
  'recovery verification evidence is forced-RLS private state'
);
select ok(
  (select bool_and(not has_table_privilege(role_name, table_name, 'select'))
   from (values
     ('public'::name, 'platform_private.recovery_verification_evidence'::text),
     ('anon'::name, 'platform_private.recovery_verification_evidence'::text),
     ('authenticated'::name, 'platform_private.recovery_verification_evidence'::text),
     ('service_role'::name, 'platform_private.recovery_verification_evidence'::text)
   ) private_table(role_name, table_name)),
  'recovery evidence has no direct browser or service-role reads'
);
select ok(
  to_regprocedure('platform_private.read_recovery_verification()') is not null
  and to_regprocedure('platform_api.read_recovery_verification()') is not null,
  'recovery verification read RPCs exist'
);
select ok(
  to_regprocedure('platform_private.protected_writes_allowed()') is not null
  and to_regprocedure('platform_api.protected_writes_allowed()') is not null,
  'protected-write safety gate RPCs exist'
);
select ok(
  to_regprocedure('platform_private.record_recovery_verification(bigint,boolean,bigint,bigint,bigint,boolean,boolean,boolean,boolean,boolean,boolean,boolean,timestamptz,timestamptz,uuid,uuid,uuid,uuid)') is not null,
  'recovery verification writer RPC exists'
);
select ok(
  has_function_privilege('service_role', 'platform_api.read_recovery_verification()', 'execute')
  and has_function_privilege('service_role', 'platform_api.protected_writes_allowed()', 'execute')
  and not has_function_privilege('anon', 'platform_api.read_recovery_verification()', 'execute')
  and not has_function_privilege('authenticated', 'platform_api.protected_writes_allowed()', 'execute'),
  'recovery read and gate adapters are service-role only'
);

select ok(
  not platform_private.protected_writes_allowed()
  and not platform_api.protected_writes_allowed(),
  'live baseline keeps protected writes closed when seven-day PITR is unavailable'
);
select ok(
  (select evidence_present
      and restore_epoch = 1
      and not pitr_supported
      and pitr_status = 'unavailable'
      and not pitr_available
      and measured_rpo_seconds is null
      and measured_rto_seconds is null
      and not protected_writes_allowed
      and reason_code = 'PITR_UNAVAILABLE'
   from platform_private.read_recovery_verification()),
  'baseline read truthfully reports unavailable PITR without claiming RPO or RTO'
);
select ok(
  (select evidence_present
      and not pitr_supported
      and pitr_status = 'unavailable'
      and not protected_writes_allowed
   from platform_api.read_recovery_verification()),
  'service-role read adapter exposes the closed baseline'
);
select throws_ok($$
  update platform_private.recovery_verification_evidence
  set pitr_supported = true
  where id = '00000000-0000-0000-0000-00000000a701'::uuid
$$, 'P0001', null, 'recovery evidence cannot be rewritten');
select throws_ok($$
  delete from platform_private.recovery_verification_evidence
  where id = '00000000-0000-0000-0000-00000000a701'::uuid
$$, 'P0001', null, 'recovery evidence cannot be deleted');
select throws_ok($$
  insert into platform_private.recovery_verification_evidence (
    restore_epoch, pitr_supported, pitr_window_seconds,
    measured_rpo_seconds, measured_rto_seconds, expires_at,
    integrity_verified, rls_verified, rpc_verified,
    idempotency_outbox_job_verified, object_verified,
    provider_webhook_verified, public_projection_verified
  ) values (
    1, false, 604800, null, null, clock_timestamp() + interval '1 hour',
    false, false, false, false, false, false, false
  )
$$, '23514', null, 'malformed unsupported-PITR evidence is rejected');

select is(
  (select protected_writes_allowed
   from platform_private.record_recovery_verification(
     1, true, 604800, 121, 14400,
     true, true, true, true, true, true, true,
     clock_timestamp() - interval '1 day', clock_timestamp() - interval '12 hours',
     '00000000-0000-0000-0000-00000000a703'::uuid,
     '00000000-0000-0000-0000-00000000a704'::uuid,
     null,
     '00000000-0000-0000-0000-000000000001'::uuid
   )),
  false,
  'RPO above 120 seconds keeps protected writes closed'
);
select ok(
  (select reason_code = 'RECOVERY_METRICS_UNVERIFIED'
      and measured_rpo_seconds = 121
      and measured_rto_seconds = 14400
      and not protected_writes_allowed
   from platform_private.read_recovery_verification()),
  'failed recovery metrics remain visible as failed evidence'
);
select is(
  (select protected_writes_allowed
   from platform_private.record_recovery_verification(
     1, true, 604800, 120, 14400,
     true, true, true, true, true, true, true,
     clock_timestamp() - interval '1 hour', clock_timestamp() - interval '1 second',
     '00000000-0000-0000-0000-00000000a705'::uuid,
     '00000000-0000-0000-0000-00000000a706'::uuid,
     null,
     '00000000-0000-0000-0000-000000000001'::uuid
   )),
  false,
  'expired recovery evidence keeps protected writes closed'
);
select ok(
  (select reason_code = 'RECOVERY_EVIDENCE_STALE'
      and not protected_writes_allowed
   from platform_private.read_recovery_verification()),
  'stale recovery evidence is reported and cannot reopen writes'
);
select is(
  (select protected_writes_allowed
   from platform_private.record_recovery_verification(
     1, true, 604800, 120, 14400,
     true, true, true, true, true, true, true,
     clock_timestamp(), clock_timestamp() + interval '1 hour',
     '00000000-0000-0000-0000-00000000a707'::uuid,
     '00000000-0000-0000-0000-00000000a708'::uuid,
     null,
     '00000000-0000-0000-0000-000000000001'::uuid
   )),
  false,
  'a fully verified fresh epoch-one self-attested row cannot open protected writes'
);
select ok(
  (select pitr_supported
      and pitr_window_seconds = 604800
      and measured_rpo_seconds = 120
      and measured_rto_seconds = 14400
      and pitr_status = 'unavailable'
      and not pitr_available
      and not protected_writes_allowed
      and reason_code = 'RECOVERY_PROVENANCE_UNVERIFIED'
   from platform_api.read_recovery_verification()),
  'fully verified self-attested evidence remains unavailable and closed'
);

select ok(platform_private.begin_restore_fence(702, 'recovery readiness epoch test'), 'restore readiness test starts a new restore epoch');
select ok(
  not platform_private.external_effects_allowed()
  and not platform_private.protected_writes_allowed(),
  'active restore epoch preserves the existing external-effect fence and closes protected writes'
);
select is(
  (select protected_writes_allowed
   from platform_private.record_recovery_verification(
     702, true, 604800, 120, 14400,
     true, true, true, true, true, true, true,
     clock_timestamp(), clock_timestamp() + interval '1 hour',
     '00000000-0000-0000-0000-00000000a709'::uuid,
     '00000000-0000-0000-0000-00000000a70a'::uuid,
     null,
     '00000000-0000-0000-0000-000000000001'::uuid
   )),
  false,
  'matching verification evidence cannot bypass an active restore fence'
);
select ok(
  (select restore_epoch = 702
      and consumer_restore_epoch is null
      and reason_code = 'RESTORE_EPOCH_MISMATCH'
      and not protected_writes_allowed
   from platform_private.read_recovery_verification()),
  'recovery read reports unreconciled consumer epoch while the fence is active'
);
select ok(platform_private.complete_restore_fence(702), 'restore readiness test releases the reconciled epoch');
select ok(
  platform_private.external_effects_allowed()
  and not platform_private.protected_writes_allowed(),
  'restore reconciliation releases only the external-effects fence; recovery provenance remains required'
);
select is(
  (select protected_writes_allowed
   from platform_private.record_recovery_verification(
     702, true, 604800, 120, 14400,
     false, true, true, true, true, true, true,
     clock_timestamp(), clock_timestamp() + interval '1 hour',
     '00000000-0000-0000-0000-00000000a70b'::uuid,
     '00000000-0000-0000-0000-00000000a70c'::uuid,
     null,
     '00000000-0000-0000-0000-000000000001'::uuid
   )),
  false,
  'an integrity check failure keeps protected writes closed after restore'
);
select ok(
  (select reason_code = 'INTEGRITY_CHECK_FAILED' and not protected_writes_allowed
   from platform_private.read_recovery_verification()),
  'failed integrity evidence is not masked by an earlier verified row'
);
select is(
  (select protected_writes_allowed
   from platform_private.record_recovery_verification(
     702, true, 604800, 120, 14400,
     true, true, true, true, true, true, true,
     clock_timestamp(), clock_timestamp() + interval '1 hour',
     '00000000-0000-0000-0000-00000000a70d'::uuid,
     '00000000-0000-0000-0000-00000000a70e'::uuid,
     null,
     '00000000-0000-0000-0000-000000000001'::uuid
   )),
  false,
  'a later fully verified self-attested row cannot reopen the gate for the current released epoch'
);
select ok(
  exists (
    select 1 from audit_private.audit_events
    where action = 'recovery.verification.recorded'
      and target_id = '00000000-0000-0000-0000-00000000a70d'::uuid
      and decision = 'failed'::platform_private.audit_decision
      and reason_code = 'RECOVERY_PROVENANCE_UNVERIFIED'
  ),
  'self-attested recovery verification writes immutable failed audit evidence'
);

select * from finish();
rollback;
