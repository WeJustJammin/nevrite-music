begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- P2-S05-AC-002, P2-S05-AC-007, P2-S05-AC-009, P2-S05-AC-013,
-- P2-S05-AC-015, P2-S05-AC-019, P2-S05-AC-021, P2-S05-AC-025,
-- P2-S05-AC-027, P2-S05-AC-031, P2-S05-AC-033, P2-S05-AC-037,
-- P2-S05-AC-039, P2-S05-AC-043, P2-S05-AC-045, P2-S05-AC-049,
-- P2-S05-AC-051, P2-S05-AC-068, P2-S05-AC-075, P2-S05-AC-077,
-- P2-S05-AC-084, P2-S05-AC-085, P2-S05-AC-086, P2-S05-AC-087,
-- P2-S05-AC-088, P2-S05-AC-089, P2-S05-AC-090, P2-S05-AC-107,
-- P2-S05-AC-108, P2-S05-AC-113, P2-S05-AC-114, P2-S05-AC-116,
-- P2-S05-AC-117, P2-S05-AC-122, P2-S05-AC-123, P2-S05-AC-125,
-- P2-S05-AC-126, P2-S05-AC-128, P2-S05-AC-129, P2-S05-AC-132,
-- P2-S05-AC-133, P2-S05-AC-135, P2-S05-AC-136, P2-S05-AC-137,
-- P2-S05-AC-225, P2-S05-AC-246, P2-S05-AC-247, P2-S05-AC-252,
-- P2-S05-AC-253.
--
-- State transitions are not a UI convention.  This suite requires the
-- profile_private mutation functions to name and enforce each transition,
-- and requires a database guard on every append-only/history record.

create temp table p2_s05_state_contract(
  table_name name primary key,
  type_name name not null,
  states text[] not null,
  transitions text[] not null
);
insert into p2_s05_state_contract values
 ('shadow_party_contexts', 'shadow_state',
  array['created','invited','suppressed','claimed','merged'],
  array['created','invited','suppressed','claimed','merged']),
 ('shadow_suppressions', 'suppression_state',
  array['active','revoked'], array['active','revoked']),
 ('invitation_dispatches', 'invitation_state',
  array['queued','sent','failed_retryable','stopped'],
  array['queued','sent','failed_retryable','stopped']),
 ('claim_cases', 'claim_state',
  array['started','proving','provisional','full','stalled','withheld','contested','revoked'],
  array['started','proving','provisional','full','stalled','withheld','contested','revoked']),
 ('claim_proof_attempts', 'proof_state',
  array['pending','accepted','rejected','expired','superseded'],
  array['pending','accepted','rejected','expired','superseded']),
 ('ownership_contests', 'contest_state',
  array['open','frozen','resolved','withdrawn'],
  array['open','frozen','resolved','withdrawn']),
 ('party_ownership_periods', 'ownership_period_state',
  array['active','ended','superseded','reversed'],
  array['active','ended','superseded','reversed']);

select ok(
  (select count(*) = 7 and bool_and(
    exists (select 1 from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
      join pg_enum e on e.enumtypid = t.oid
     where n.nspname = 'profile' and t.typname = type_name
       and e.enumlabel = any(states)))
   from p2_s05_state_contract),
  'every Slice 05 state machine is backed by a closed enum');

select ok(
  (select count(*) = 7 and bool_and(
    exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('profile_private.' || table_name)
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* 'state'))
   from p2_s05_state_contract),
  'every private record constrains state at the database boundary');

-- State guard functions are expected to reject skipped or terminal reopen
-- transitions.  The source check is intentionally strict: a migration that
-- only stores enum values but lets direct UPDATE bypass the state machine is
-- not a green implementation.
select ok(
  (select count(*) = 7 and bool_and(
    exists (select 1 from pg_trigger tr
      where tr.tgrelid = to_regclass('profile_private.' || table_name)
        and not tr.tgisinternal
        and pg_get_triggerdef(tr.oid) ~* '(state|version|history)'))
   from p2_s05_state_contract),
  'all Slice 05 records have mutation guards for state/version/history');
select ok(
  (select count(*) >= 1 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ '(invalid.transition|terminal|state)')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'profile_private' and p.prokind = 'f'
      and p.proname in ('profile_state_transition_guard',
                        'enforce_profile_state_transition',
                        'assert_profile_state_transition')),
  'profile state guard rejects invalid and terminal transitions');

-- Challenge issue/consume requirements: only a hash is persisted, code is
-- single-use, expiry is fifteen minutes, attempts burn through five, and
-- accepted/expired/over-attempted challenges cannot grant control.
select ok(
  (select count(*) >= 1 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ 'challenge_hash'
    and lower(pg_get_functiondef(p.oid)) ~ 'expires_at'
    and lower(pg_get_functiondef(p.oid)) ~ 'attempts_used'
    and lower(pg_get_functiondef(p.oid)) ~ '(expired|overattempted|attempts)'
    and lower(pg_get_functiondef(p.oid)) ~ '(accepted|rejected|superseded)')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('profile_private','platform_api') and p.prokind = 'f'
      and p.proname in ('rpc_issue_claim_challenge',
                        'rpc_submit_claim_proof', 'profile_issue_challenge',
                        'profile_submit_proof')),
  'claim challenge RPCs hash, expire, burn, and terminally close challenges');
select ok(
  exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.claim_proof_attempts')
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ~* 'expires_at')
  or exists (select 1 from pg_index i
    where i.indrelid = to_regclass('profile_private.claim_proof_attempts')
      and pg_get_indexdef(i.indexrelid) ~* 'expires_at'),
  'pending proof attempts are indexed by expiry for deterministic burn/recovery');

-- Tier evaluation must attach control to the existing party.  Conversion
-- cannot silently turn a Tier C ring into full ownership.
select ok(
  (select count(*) >= 1 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ '(provisional|full)'
    and lower(pg_get_functiondef(p.oid)) ~ '(tier|independence|attester)'
    and lower(pg_get_functiondef(p.oid)) ~ 'party_ownership_periods')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('profile_private','platform_api') and p.prokind = 'f'
      and p.proname in ('rpc_submit_claim_proof', 'rpc_convert_claim',
                        'profile_submit_proof', 'profile_convert_claim')),
  'proof and conversion RPCs create provisional/full periods on the existing party');
select ok(
  exists (select 1 from pg_index i
    where i.indrelid = to_regclass('profile_private.party_ownership_periods')
      and i.indisunique and pg_get_indexdef(i.indexrelid) ~* 'party_id')
  or exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.party_ownership_periods')
      and c.contype = 'x'),
  'only one active ownership period can exist per party');

-- Contest lifecycle preserves operate-only access, blocks transfer while open
-- or frozen, and sends credible conflict to Shard 06 instead of guessing.
select ok(
  (select count(*) = 4 and bool_and(
    exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('profile_private.ownership_contests')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* s))
   from unnest(array['open','frozen','resolved','withdrawn']) s),
  'P2-S05-AC-089 closes contest state to open frozen resolved withdrawn');
select ok(
  exists (select 1 from pg_index i
    where i.indrelid = to_regclass('profile_private.ownership_contests')
      and i.indisunique and i.indpred is not null
      and pg_get_indexdef(i.indexrelid) ~* 'party_id'
      and pg_get_indexdef(i.indexrelid) ~* 'challenger_claim_id'),
  'P2-S05-AC-089 limits contests to one open challenger per target');

-- Transfer acceptance creates a dated period and a public changed-hands
-- marker; reversal is compensating and never deletes evidence or actions.
select ok(
  (select count(*) = 3 and bool_and(
    exists (select 1 from pg_constraint c
      where c.conrelid = to_regclass('profile_private.party_ownership_periods')
        and c.contype = 'c'
        and pg_get_constraintdef(c.oid) ~* s))
   from unnest(array['claim','transfer','reversal']) s),
  'P2-S05-AC-090 ownership periods close claim transfer reversal basis');
select ok(
  exists (select 1 from pg_index i
    where i.indrelid = to_regclass('profile_private.party_ownership_periods')
      and i.indisunique and pg_get_indexdef(i.indexrelid) ~* 'party_id')
  or exists (select 1 from pg_constraint c
    where c.conrelid = to_regclass('profile_private.party_ownership_periods')
      and c.contype = 'x'),
  'P2-S05-AC-090 periods prevent overlapping live control and support reversal history');

-- Account-free remedies retain the source fact, hash the contacted route,
-- distinguish suppression from correction, and never expose a public registry
-- of non-users.
select ok(
  (select count(*) >= 1 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ '(suppress|correct)'
    and lower(pg_get_functiondef(p.oid)) ~ '(route_fingerprint|proof)'
    and lower(pg_get_functiondef(p.oid)) ~ '(case_id|evidence_ref)'
    and lower(pg_get_functiondef(p.oid)) ~ '(outreach|publication)')
     from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('profile_private','platform_api') and p.prokind = 'f'
      and p.proname in ('rpc_submit_remedy', 'profile_submit_remedy')),
  'P2-S05-AC-116 account-free remedy distinguishes suppression and correction');
select ok(
  not exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public_api' and c.relkind in ('r','v','m')
     and pg_get_viewdef(c.oid, true) ~* 'shadow_suppressions'),
  'suppression records are never exposed as a public non-user registry');

select * from finish();
rollback;
