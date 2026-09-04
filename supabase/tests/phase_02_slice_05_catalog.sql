begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- Slice 05 database RED contract.  The migration is intentionally absent at
-- this stage; every assertion below must fail only because the declared
-- profile_private schema, records, or catalog policy has not landed.
-- P2-S05-AC-001, P2-S05-AC-002, P2-S05-AC-003, P2-S05-AC-006,
-- P2-S05-AC-012, P2-S05-AC-018, P2-S05-AC-024, P2-S05-AC-030,
-- P2-S05-AC-036, P2-S05-AC-042, P2-S05-AC-048, P2-S05-AC-052,
-- P2-S05-AC-054, P2-S05-AC-055, P2-S05-AC-084, P2-S05-AC-085,
-- P2-S05-AC-086, P2-S05-AC-087, P2-S05-AC-088, P2-S05-AC-089,
-- P2-S05-AC-090, P2-S05-AC-225, P2-S05-AC-246, P2-S05-AC-247.

select has_schema('profile', 'profile enum namespace exists');
select has_schema('profile_private', 'profile private schema exists');
select has_schema('profile_api', 'profile API projection schema exists');

select has_table('profile_private', 'shadow_party_contexts',
  'shadow party context table exists');
select has_table('profile_private', 'shadow_suppressions',
  'shadow suppression table exists');
select has_table('profile_private', 'invitation_dispatches',
  'invitation dispatch table exists');
select has_table('profile_private', 'claim_cases',
  'claim case table exists');
select has_table('profile_private', 'claim_proof_attempts',
  'claim proof attempt table exists');
select has_table('profile_private', 'ownership_contests',
  'ownership contest table exists');
select has_table('profile_private', 'party_ownership_periods',
  'party ownership period table exists');

select ok(
  (select count(*) = 7 and bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'profile_private'
      and c.relname = any(array[
        'shadow_party_contexts', 'shadow_suppressions',
        'invitation_dispatches', 'claim_cases', 'claim_proof_attempts',
        'ownership_contests', 'party_ownership_periods']::name[])),
  'all seven Slice 05 records force RLS');

-- The browser and service roles use narrowly granted RPCs.  No role may read
-- or mutate the private records directly, including service_role.
select ok(
  (select count(*) = 28
      and bool_and(
        case when to_regclass(t.table_name) is null then false
             else not has_table_privilege(r.role_name, t.table_name, 'select')
              and not has_table_privilege(r.role_name, t.table_name, 'insert')
              and not has_table_privilege(r.role_name, t.table_name, 'update')
              and not has_table_privilege(r.role_name, t.table_name, 'delete')
        end)
     from (values ('public'::name), ('anon'::name),
                  ('authenticated'::name), ('service_role'::name)) r(role_name)
     cross join (values
       ('profile_private.shadow_party_contexts'::text),
       ('profile_private.shadow_suppressions'::text),
       ('profile_private.invitation_dispatches'::text),
       ('profile_private.claim_cases'::text),
       ('profile_private.claim_proof_attempts'::text),
       ('profile_private.ownership_contests'::text),
       ('profile_private.party_ownership_periods'::text)) t(table_name)),
  'private records have no direct public, browser, or service grants');

select ok(
  (select count(*) = 35
     from information_schema.columns c
    where c.table_schema = 'profile_private'
      and c.table_name = any(array[
        'shadow_party_contexts', 'shadow_suppressions',
        'invitation_dispatches', 'claim_cases', 'claim_proof_attempts',
        'ownership_contests', 'party_ownership_periods']::text[])
      and c.column_name = any(array[
        'id', 'owner_id', 'version', 'created_at', 'updated_at']::text[])),
  'all private records carry the common immutable identity/version core');

-- Record-specific columns are deliberately enumerated so a partial table
-- cannot make a later API implementation appear complete.
select has_column('profile_private', 'shadow_party_contexts', 'party_id',
  'shadow context stores represented party');
select has_column('profile_private', 'shadow_party_contexts', 'creator_person_id',
  'shadow context stores creating person');
select has_column('profile_private', 'shadow_party_contexts', 'creator_acting_party_id',
  'shadow context stores creating acting party');
select has_column('profile_private', 'shadow_party_contexts', 'source_domain',
  'shadow context stores source domain');
select has_column('profile_private', 'shadow_party_contexts', 'source_entity_id',
  'shadow context stores source entity');
select has_column('profile_private', 'shadow_party_contexts', 'role_code',
  'shadow context stores structured role');
select has_column('profile_private', 'shadow_party_contexts', 'instrument_ref',
  'shadow context stores structured instrument reference');
select has_column('profile_private', 'shadow_party_contexts', 'contact_route_id',
  'shadow context stores protected contact route');
select has_column('profile_private', 'shadow_party_contexts', 'state',
  'shadow context stores closed state');

select has_column('profile_private', 'shadow_suppressions', 'party_id',
  'suppression optionally stores represented party');
select has_column('profile_private', 'shadow_suppressions', 'route_fingerprint',
  'suppression stores only a route fingerprint');
select has_column('profile_private', 'shadow_suppressions', 'remedy_action',
  'suppression stores suppress or correct action');
select has_column('profile_private', 'shadow_suppressions', 'scope',
  'suppression stores outreach/publication scope');
select has_column('profile_private', 'shadow_suppressions', 'state',
  'suppression stores active or revoked state');
select has_column('profile_private', 'shadow_suppressions', 'case_id',
  'suppression stores protected case reference');
select has_column('profile_private', 'shadow_suppressions', 'evidence_ref',
  'suppression stores protected evidence reference');

select has_column('profile_private', 'invitation_dispatches', 'shadow_id',
  'invitation points to shadow context');
select has_column('profile_private', 'invitation_dispatches', 'route_id',
  'invitation points to protected contact route');
select has_column('profile_private', 'invitation_dispatches', 'attempt_no',
  'invitation stores bounded attempt number');
select has_column('profile_private', 'invitation_dispatches', 'trigger',
  'invitation stores registered trigger');
select has_column('profile_private', 'invitation_dispatches', 'state',
  'invitation stores closed dispatch state');
select has_column('profile_private', 'invitation_dispatches', 'scheduled_at',
  'invitation stores scheduled send time');
select has_column('profile_private', 'invitation_dispatches', 'sent_at',
  'invitation stores send time');
select has_column('profile_private', 'invitation_dispatches', 'provider_ref',
  'invitation stores provider reference');
select has_column('profile_private', 'invitation_dispatches', 'provider_digest',
  'invitation stores provider digest');

select has_column('profile_private', 'claim_cases', 'target_party_id',
  'claim stores target party');
select has_column('profile_private', 'claim_cases', 'claimant_person_id',
  'claim stores claimant person');
select has_column('profile_private', 'claim_cases', 'claim_kind',
  'claim stores self representation or transfer kind');
select has_column('profile_private', 'claim_cases', 'recipient_person_id',
  'transfer claim stores named recipient');
select has_column('profile_private', 'claim_cases', 'state',
  'claim stores closed state');
select has_column('profile_private', 'claim_cases', 'control_level',
  'claim stores none provisional or full control');
select has_column('profile_private', 'claim_cases', 'proof_started_at',
  'claim stores proof start time');
select has_column('profile_private', 'claim_cases', 'proof_completed_at',
  'claim stores proof completion time');
select has_column('profile_private', 'claim_cases', 'window_expires_at',
  'claim stores reversibility window');
select has_column('profile_private', 'claim_cases', 'transfer_decision',
  'transfer claim stores decision');
select has_column('profile_private', 'claim_cases', 'transfer_expires_at',
  'transfer claim stores offer expiry');

select has_column('profile_private', 'claim_proof_attempts', 'claim_id',
  'proof attempt points to claim');
select has_column('profile_private', 'claim_proof_attempts', 'tier',
  'proof attempt stores proof tier');
select has_column('profile_private', 'claim_proof_attempts', 'method',
  'proof attempt stores registered method');
select has_column('profile_private', 'claim_proof_attempts', 'challenge_hash',
  'proof attempt stores hash not challenge code');
select has_column('profile_private', 'claim_proof_attempts', 'evidence_ref',
  'proof attempt stores evidence reference');
select has_column('profile_private', 'claim_proof_attempts', 'attester_ids',
  'proof attempt stores bounded attester ids');
select has_column('profile_private', 'claim_proof_attempts', 'independence_result',
  'proof attempt stores independence result');
select has_column('profile_private', 'claim_proof_attempts', 'state',
  'proof attempt stores closed state');
select has_column('profile_private', 'claim_proof_attempts', 'attempts_used',
  'proof attempt stores bounded attempts used');
select has_column('profile_private', 'claim_proof_attempts', 'expires_at',
  'proof attempt stores challenge expiry');

select has_column('profile_private', 'ownership_contests', 'party_id',
  'contest stores contested party');
select has_column('profile_private', 'ownership_contests', 'incumbent_claim_id',
  'contest stores incumbent claim');
select has_column('profile_private', 'ownership_contests', 'challenger_claim_id',
  'contest stores challenger claim');
select has_column('profile_private', 'ownership_contests', 'state',
  'contest stores closed state');
select has_column('profile_private', 'ownership_contests', 'response_due_at',
  'contest stores response deadline');
select has_column('profile_private', 'ownership_contests', 'resolution_basis',
  'contest stores resolution basis');
select has_column('profile_private', 'ownership_contests', 'winner_claim_id',
  'contest stores winner claim');
select has_column('profile_private', 'ownership_contests', 'shard06_case_id',
  'contest stores Shard 06 case reference');
select has_column('profile_private', 'ownership_contests', 'reversal_end_at',
  'contest stores reversible resolution deadline');

select has_column('profile_private', 'party_ownership_periods', 'party_id',
  'ownership period stores subject party');
select has_column('profile_private', 'party_ownership_periods', 'owner_person_id',
  'ownership period stores owner person');
select has_column('profile_private', 'party_ownership_periods', 'basis_kind',
  'ownership period stores claim transfer or reversal basis');
select has_column('profile_private', 'party_ownership_periods', 'basis_id',
  'ownership period stores basis reference');
select has_column('profile_private', 'party_ownership_periods', 'starts_at',
  'ownership period stores start time');
select has_column('profile_private', 'party_ownership_periods', 'ends_at',
  'ownership period stores end time');
select has_column('profile_private', 'party_ownership_periods', 'control_level',
  'ownership period stores provisional or full control');
select has_column('profile_private', 'party_ownership_periods', 'state',
  'ownership period stores closed state');
select has_column('profile_private', 'party_ownership_periods', 'case_id',
  'ownership period stores protected case reference');

-- Closed enums are part of the storage contract, not application-only values.
select ok(
  (select count(*) = 7 and bool_and(labels @> expected)
     from (values
       ('shadow_state'::name,
        array['created','invited','suppressed','claimed','merged']::text[]),
       ('suppression_state'::name, array['active','revoked']::text[]),
       ('invitation_state'::name,
        array['queued','sent','failed_retryable','stopped']::text[]),
       ('claim_state'::name,
        array['started','proving','provisional','full','stalled','withheld','contested','revoked']::text[]),
       ('proof_state'::name,
        array['pending','accepted','rejected','expired','superseded']::text[]),
       ('contest_state'::name,
        array['open','frozen','resolved','withdrawn']::text[]),
       ('ownership_period_state'::name,
        array['active','ended','superseded','reversed']::text[])) expected_types(type_name, expected)
     cross join lateral (
       select array_agg(e.enumlabel order by e.enumsortorder)::text[] labels
         from pg_type t
         join pg_namespace n on n.oid = t.typnamespace
         join pg_enum e on e.enumtypid = t.oid
        where n.nspname = 'profile' and t.typname = expected_types.type_name
     ) actual),
  'all Slice 05 states are closed profile enums');

-- Positive versions, bounded proof attempts, and only one live control period
-- are database constraints.  This remains a catalog assertion before rows or
-- mutation RPCs exist.
select ok(
  (select count(*) = 7 and bool_and(
    exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('profile_private.' || table_name)
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'version.*>'))
   from (values
    ('shadow_party_contexts'), ('shadow_suppressions'),
    ('invitation_dispatches'), ('claim_cases'),
    ('claim_proof_attempts'), ('ownership_contests'),
    ('party_ownership_periods')) t(table_name)),
  'every Slice 05 record constrains version to a positive value');
select ok(
  exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.invitation_dispatches')
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* 'attempt_no.*1'
      and pg_get_constraintdef(c.oid) ~* '6'),
  'invitation attempt number is constrained to one through six');
select ok(
  exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.claim_proof_attempts')
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* 'attempts_used.*0'
      and pg_get_constraintdef(c.oid) ~* '5'),
  'proof attempts used is constrained to zero through five');
select ok(
  exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.shadow_suppressions')
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* 'octet_length'
      and pg_get_constraintdef(c.oid) ~* '32'),
  'suppression route fingerprint is exactly 32 bytes');
select ok(
  exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.party_ownership_periods')
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* 'ends_at.*starts_at'),
  'ownership period end must follow its start');

select ok(
  (select count(*) = 3 and bool_and(indisunique and indpred is not null)
     from pg_index i
     join pg_class c on c.oid = i.indrelid
     join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'profile_private'
      and ((c.relname = 'shadow_suppressions'
            and pg_get_indexdef(i.indexrelid) ~* 'party_id.*route_fingerprint.*scope')
        or (c.relname = 'claim_cases'
            and pg_get_indexdef(i.indexrelid) ~* 'target_party_id.*claimant_person_id')
        or (c.relname = 'ownership_contests'
            and pg_get_indexdef(i.indexrelid) ~* 'party_id.*challenger_claim_id'))),
  'active suppression, claim, and contest uniqueness is partial and idempotent');
select ok(
  exists (select 1 from pg_index i
    where i.indrelid = to_regclass('profile_private.shadow_party_contexts')
      and i.indisunique and pg_get_indexdef(i.indexrelid) ~* 'source_domain'
      and pg_get_indexdef(i.indexrelid) ~* 'source_entity_id'
      and pg_get_indexdef(i.indexrelid) ~* 'party_id'),
  'shadow source-domain entity party binding is unique');
select ok(
  exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.shadow_suppressions')
      and c.contype = 'f'
      and pg_get_constraintdef(c.oid) ~* 'shadow_party_contexts'),
  'suppression owner references its shadow context restrictively');
select ok(
  exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.invitation_dispatches')
      and c.contype = 'f'
      and pg_get_constraintdef(c.oid) ~* 'shadow_party_contexts'),
  'invitation owner references its shadow context restrictively');
select ok(
  (select count(*) >= 4 from pg_constraint c
    where c.conrelid in (
      to_regclass('profile_private.claim_proof_attempts'),
      to_regclass('profile_private.ownership_contests'))
      and c.contype = 'f'),
  'proof and contest references are protected foreign keys');

-- Historical periods must be append-only and non-overlapping for live control.
select ok(
  exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.party_ownership_periods')
      and c.contype = 'x'
      and pg_get_constraintdef(c.oid) ~* 'party_id'
      and pg_get_constraintdef(c.oid) ~* 'starts_at'),
  'live ownership periods use an exclusion constraint against overlap');
select ok(
  exists (select 1 from pg_trigger tr
    where tr.tgrelid = to_regclass('profile_private.party_ownership_periods')
      and not tr.tgisinternal
      and pg_get_triggerdef(tr.oid) ~* 'update|delete'),
  'ownership history has an append-only mutation guard');

select * from finish();
rollback;
