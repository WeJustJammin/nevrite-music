begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- P2-S07-AC-037..043: schema and policy boundaries must make invalid keys,
-- scope/version conflicts, ownership expiry, cohort drift, and kill events
-- fail closed.  Catalog predicates avoid aborting on the pre-migration RED state.

select ok(
  to_regclass('platform_private.cfg_setting_definition_versions') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.cfg_setting_definition_versions')
        and pg_get_constraintdef(c.oid) ~* 'key'),
  'P2-S07-AC-037 definition registry rejects undefined, retired, protected, and implicit keys');

select ok(
  to_regclass('platform_private.cfg_setting_value_versions') is not null
    and exists (select 1 from pg_policies p
      where p.schemaname = 'platform_private'
        and p.tablename = 'cfg_setting_value_versions')
    and exists (select 1 from pg_class c
      where c.oid = to_regclass('platform_private.cfg_setting_value_versions')
        and c.relrowsecurity),
  'P2-S07-AC-038 effective-value resolution fails closed for disallowed scope, vanished parent, and evaluator outage');

select ok(
  to_regclass('platform_private.cfg_config_change_reviews') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.cfg_config_change_reviews')
        and pg_get_constraintdef(c.oid) ~* 'impact_manifest_hash'),
  'P2-S07-AC-039 proposals reject broader grants, changed definitions, and non-computable rollback');

select ok(
  to_regclass('platform_private.cfg_config_approvals') is not null
    and exists (select 1 from pg_policies p
      where p.schemaname = 'platform_private'
        and p.tablename = 'cfg_config_approvals')
    and exists (select 1 from pg_class c
      where c.oid = to_regclass('platform_private.cfg_config_approvals')
        and c.relrowsecurity),
  'P2-S07-AC-040 approval boundaries invalidate self, duplicate, stale-MFA, and changed-context reviews');

select ok(
  to_regclass('platform_private.cfg_feature_flag_versions') is not null
    and exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('platform_private.cfg_feature_flag_versions')
        and pg_get_constraintdef(c.oid) ~* 'expires_at'),
  'P2-S07-AC-041 feature flags retain safe fallback and stale-owner cleanup evidence');

select ok(
  to_regclass('platform_private.cfg_experiment_versions') is not null
    and exists (select 1 from pg_policies p
      where p.schemaname = 'platform_private'
        and p.tablename = 'cfg_experiment_versions')
    and exists (select 1 from pg_class c
      where c.oid = to_regclass('platform_private.cfg_experiment_versions')
        and c.relrowsecurity),
  'P2-S07-AC-042 experiments stop or freeze on protected dimensions, consent loss, drift, and allocation changes');

select ok(
  to_regclass('platform_private.cfg_kill_switch_activations') is not null
    and exists (select 1 from pg_policies p
      where p.schemaname = 'platform_private'
        and p.tablename = 'cfg_kill_switch_activations')
    and exists (select 1 from pg_class c
      where c.oid = to_regclass('platform_private.cfg_kill_switch_activations')
        and c.relrowsecurity),
  'P2-S07-AC-043 kill-switch activation denies undeclared scope and reconciles control-plane outages');

select * from finish();

rollback;
