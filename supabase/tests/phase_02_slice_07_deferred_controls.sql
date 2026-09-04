begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

insert into auth.users(id) values
  ('a7070000-0000-4000-8000-000000000001');

select throws_ok($sql$
  insert into platform_private.cfg_feature_flag_versions(
    id, key, owner_person_id, purpose, environments,
    eligibility_rule_key, eligibility_rule_version, allocation, fallback,
    dependencies, starts_at, ends_at, expires_at, state, version_no, created_by
  ) values (
    'a7070000-0000-4000-8000-000000000101', 'release.null-fallback',
    'a7070000-0000-4000-8000-000000000001', 'release_availability',
    array['production'], 'release.standard', 1, '{"enabled": 100}', 'null',
    array['release.api'], '2026-09-01T00:00:00Z', '2026-09-02T00:00:00Z',
    '2026-09-03T00:00:00Z', 'active', 1,
    'a7070000-0000-4000-8000-000000000001'
  )
$sql$, '23514', null,
  'P2-S07-AC-041 feature flags reject a JSON-null fallback');

select throws_ok($sql$
  insert into platform_private.cfg_feature_flag_versions(
    id, key, owner_person_id, purpose, environments,
    eligibility_rule_key, eligibility_rule_version, allocation, fallback,
    dependencies, starts_at, ends_at, expires_at, state, version_no, created_by
  ) values (
    'a7070000-0000-4000-8000-000000000102', 'release.self-dependent',
    'a7070000-0000-4000-8000-000000000001', 'release_availability',
    array['production'], 'release.standard', 1, '{"enabled": 100}', 'false',
    array['release.self-dependent'], '2026-09-01T00:00:00Z',
    '2026-09-02T00:00:00Z', '2026-09-03T00:00:00Z', 'active', 1,
    'a7070000-0000-4000-8000-000000000001'
  )
$sql$, '23514', null,
  'P2-S07-AC-041 feature flags reject a missing self dependency');

insert into platform_private.cfg_feature_flag_versions(
  id, key, owner_person_id, purpose, environments,
  eligibility_rule_key, eligibility_rule_version, allocation, fallback,
  dependencies, starts_at, ends_at, expires_at, state, version_no, created_by
) values (
  'a7070000-0000-4000-8000-000000000103', 'release.safe-flag',
  'a7070000-0000-4000-8000-000000000001', 'release_availability',
  array['production'], 'release.standard', 1, '{"enabled": 100}', 'false',
  array['release.api'], '2026-09-01T00:00:00Z', '2026-09-02T00:00:00Z',
  '2026-09-03T00:00:00Z', 'active', 1,
  'a7070000-0000-4000-8000-000000000001'
);

select throws_ok($sql$
  update platform_private.cfg_feature_flag_versions
     set fallback = 'true'
   where id = 'a7070000-0000-4000-8000-000000000103'
$sql$, 'P0001', 'APPEND_ONLY_RECORD',
  'P2-S07-AC-041 flag history and its safe fallback are append-only');

select throws_ok($sql$
  insert into platform_private.cfg_experiment_versions(
    id, key, owner_person_id, hypothesis, eligibility_dimensions, variants,
    allocation, metrics, consent_ref, stop_rule, starts_at, ends_at, state,
    version_no, created_by
  ) values (
    'a7070000-0000-4000-8000-000000000201', 'experiment.protected',
    'a7070000-0000-4000-8000-000000000001', 'Protected traits must fail',
    array['private_message_content'], '{"control": {}, "treatment": {}}',
    '{"control": 50, "treatment": 50}', array['activation'], null,
    '{"metric": "error_rate", "threshold": 5}',
    '2026-09-01T00:00:00Z', '2026-09-03T00:00:00Z', 'draft', 1,
    'a7070000-0000-4000-8000-000000000001'
  )
$sql$, '23514', null,
  'P2-S07-AC-042 experiments reject protected or private dimensions');

select throws_ok($sql$
  insert into platform_private.cfg_experiment_versions(
    id, key, owner_person_id, hypothesis, eligibility_dimensions, variants,
    allocation, metrics, consent_ref, stop_rule, starts_at, ends_at, state,
    version_no, created_by
  ) values (
    'a7070000-0000-4000-8000-000000000202', 'experiment.no-consent',
    'a7070000-0000-4000-8000-000000000001', 'Consent gates running',
    array['route'], '{"control": {}, "treatment": {}}',
    '{"control": 50, "treatment": 50}', array['activation'], null,
    '{"metric": "error_rate", "threshold": 5}',
    '2026-09-01T00:00:00Z', '2026-09-03T00:00:00Z', 'running', 1,
    'a7070000-0000-4000-8000-000000000001'
  )
$sql$, '23514', null,
  'P2-S07-AC-042 experiments cannot run without an active consent reference');

insert into platform_private.cfg_experiment_versions(
  id, key, owner_person_id, hypothesis, eligibility_dimensions, variants,
  allocation, metrics, consent_ref, stop_rule, starts_at, ends_at, state,
  version_no, created_by
) values (
  'a7070000-0000-4000-8000-000000000203', 'experiment.sticky',
  'a7070000-0000-4000-8000-000000000001', 'Assignment remains sticky',
  array['route'], '{"control": {}, "treatment": {}}',
  '{"control": 50, "treatment": 50}', array['activation'],
  'consent.product-analytics.v1', '{"metric": "error_rate", "threshold": 5}',
  '2026-09-01T00:00:00Z', '2026-09-03T00:00:00Z', 'running', 1,
  'a7070000-0000-4000-8000-000000000001'
);

select throws_ok($sql$
  update platform_private.cfg_experiment_versions
     set allocation = '{"control": 10, "treatment": 90}'
   where id = 'a7070000-0000-4000-8000-000000000203'
$sql$, 'P0001', 'APPEND_ONLY_RECORD',
  'P2-S07-AC-042 allocation changes require a new version and never rebalance history');

select throws_ok($sql$
  insert into platform_private.cfg_kill_switch_versions(
    id, key, owner_person_id, allowed_scopes, fallback_mode,
    runtime_contract_version, state, version_no
  ) values (
    'a7070000-0000-4000-8000-000000000301', 'incident.empty-scopes',
    'a7070000-0000-4000-8000-000000000001', '[]', 'safe_read_only',
    1, 'active', 1
  )
$sql$, '23514', null,
  'P2-S07-AC-043 kill switches reject an empty declared-scope registry');

insert into platform_private.cfg_kill_switch_versions(
  id, key, owner_person_id, allowed_scopes, fallback_mode,
  runtime_contract_version, state, version_no
) values (
  'a7070000-0000-4000-8000-000000000302', 'incident.platform-safe',
  'a7070000-0000-4000-8000-000000000001',
  '[{"scopeType": "platform", "scopeId": null}]', 'safe_read_only',
  1, 'active', 1
);

select throws_ok($sql$
  insert into platform_private.cfg_kill_switch_activations(
    id, switch_id, switch_version_id, scope_type, scope_id, actor_person_id,
    reason, started_at, canonical_state, runtime_snapshot_hash, incident_ref,
    version_no
  ) values (
    'a7070000-0000-4000-8000-000000000303',
    'a7070000-0000-4000-8000-000000000302',
    'a7070000-0000-4000-8000-000000000302', 'party',
    'a7070000-0000-4000-8000-000000000399',
    'a7070000-0000-4000-8000-000000000001', 'undeclared scope must fail',
    '2026-09-01T00:00:00Z', 'requested', repeat('a', 64), 'INC-S07-001', 1
  )
$sql$, 'P0001', 'UNDECLARED_SWITCH_SCOPE',
  'P2-S07-AC-043 kill-switch activation denies an undeclared scope');

insert into platform_private.cfg_kill_switch_activations(
  id, switch_id, switch_version_id, scope_type, scope_id, actor_person_id,
  reason, started_at, canonical_state, runtime_snapshot_hash, incident_ref,
  version_no
) values (
  'a7070000-0000-4000-8000-000000000304',
  'a7070000-0000-4000-8000-000000000302',
  'a7070000-0000-4000-8000-000000000302', 'platform', null,
  'a7070000-0000-4000-8000-000000000001', 'canonical outage evidence',
  '2026-09-01T00:00:00Z', 'requested', repeat('b', 64), 'INC-S07-002', 1
);

update platform_private.cfg_kill_switch_activations
   set canonical_state = 'active', version_no = 2
 where id = 'a7070000-0000-4000-8000-000000000304';
update platform_private.cfg_kill_switch_activations
   set canonical_state = 'resolving', version_no = 3
 where id = 'a7070000-0000-4000-8000-000000000304';
update platform_private.cfg_kill_switch_activations
   set canonical_state = 'ended', version_no = 4,
       ends_at = '2026-09-01T00:05:00Z', resolved_at = '2026-09-01T00:05:00Z'
 where id = 'a7070000-0000-4000-8000-000000000304';

select is(
  (select canonical_state from platform_private.cfg_kill_switch_activations
    where id = 'a7070000-0000-4000-8000-000000000304'),
  'ended',
  'P2-S07-AC-043 control-plane reconciliation preserves canonical incident evidence'
);

select throws_ok($sql$
  update platform_private.cfg_kill_switch_activations
     set canonical_state = 'active', version_no = 5
   where id = 'a7070000-0000-4000-8000-000000000304'
$sql$, 'P0001', 'INVALID_SWITCH_TRANSITION',
  'P2-S07-AC-043 ended kill-switch evidence cannot be reopened');

select * from finish();
rollback;
