begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- P2-S07-AC-029..036: each governed configuration relation must exist with
-- the locked authority columns before worker implementation begins.  These
-- catalog-only assertions remain safe while the Slice 07 migration is absent.

select ok(
  to_regclass('platform_private.cfg_setting_definition_versions') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.cfg_setting_definition_versions')
        and attnum > 0 and not attisdropped
        and attname in ('id', 'definition_id', 'key', 'version_no', 'value_kind',
          'schema', 'owner_capability', 'allowed_scopes', 'precedence',
          'merge_mode', 'default_source', 'default_value', 'risk_class',
          'approver_policy', 'consumer_keys')) >= 15,
  'P2-S07-AC-029 cfg_setting_definition_versions exposes the immutable definition registry');

select ok(
  to_regclass('platform_private.cfg_setting_value_versions') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.cfg_setting_value_versions')
        and attnum > 0 and not attisdropped
        and attname in ('id', 'definition_id', 'definition_version_id',
          'scope_type', 'scope_id', 'environment', 'typed_value',
          'effective_from', 'effective_to', 'state', 'author_person_id',
          'acting_party_id', 'supersedes_id', 'value_hash', 'version_no',
          'created_at', 'updated_at')) >= 17,
  'P2-S07-AC-030 cfg_setting_value_versions preserves typed values and version lineage');

select ok(
  to_regclass('platform_private.cfg_config_change_reviews') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.cfg_config_change_reviews')
        and attnum > 0 and not attisdropped
        and attname in ('id', 'candidate_type', 'candidate_id',
          'candidate_version', 'frozen_hash', 'impact_manifest',
          'impact_manifest_hash', 'risk_class', 'required_approvals',
          'state', 'submitted_by', 'submitted_at', 'version_no')) >= 13,
  'P2-S07-AC-031 cfg_config_change_reviews freezes candidate and impact hashes');

select ok(
  to_regclass('platform_private.cfg_config_approvals') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.cfg_config_approvals')
        and attnum > 0 and not attisdropped
        and attname in ('review_id', 'reviewer_person_id', 'acting_party_id',
          'capability', 'decision', 'reason', 'reviewed_hash', 'decided_at',
          'review_version')) >= 9,
  'P2-S07-AC-032 cfg_config_approvals records distinct, hash-bound decisions');

select ok(
  to_regclass('platform_private.cfg_feature_flag_versions') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.cfg_feature_flag_versions')
        and attnum > 0 and not attisdropped
        and attname in ('id', 'key', 'owner_person_id', 'purpose',
          'environments', 'eligibility_rule_key', 'eligibility_rule_version',
          'allocation', 'fallback', 'dependencies', 'starts_at', 'ends_at',
          'expires_at', 'state', 'version_no', 'created_by')) >= 16,
  'P2-S07-AC-033 cfg_feature_flag_versions records bounded ownership, allocation, and expiry');

select ok(
  to_regclass('platform_private.cfg_experiment_versions') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.cfg_experiment_versions')
        and attnum > 0 and not attisdropped
        and attname in ('id', 'key', 'owner_person_id', 'hypothesis',
          'eligibility_dimensions', 'variants', 'allocation', 'metrics',
          'consent_ref', 'stop_rule', 'starts_at', 'ends_at', 'state',
          'version_no', 'created_by', 'created_at')) >= 16,
  'P2-S07-AC-034 cfg_experiment_versions carries consent, stop, and deterministic allocation metadata');

select ok(
  to_regclass('platform_private.cfg_kill_switch_versions') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.cfg_kill_switch_versions')
        and attnum > 0 and not attisdropped
        and attname in ('id', 'key', 'owner_person_id', 'allowed_scopes',
          'fallback_mode', 'runtime_contract_version', 'state', 'version_no',
          'created_at')) >= 9,
  'P2-S07-AC-035 cfg_kill_switch_versions binds precompiled fallback and runtime contract versions');

select ok(
  to_regclass('platform_private.cfg_kill_switch_activations') is not null
    and (select count(*) from pg_attribute
      where attrelid = to_regclass('platform_private.cfg_kill_switch_activations')
        and attnum > 0 and not attisdropped
        and attname in ('id', 'switch_id', 'switch_version_id', 'scope_type',
          'scope_id', 'actor_person_id', 'acting_party_id', 'reason',
          'started_at', 'ends_at', 'canonical_state', 'runtime_snapshot_hash',
          'incident_ref', 'version_no', 'created_at', 'resolved_at')) >= 16,
  'P2-S07-AC-036 cfg_kill_switch_activations records scoped incident evidence and reconciliation state');

select * from finish();

rollback;
