begin;

-- Slice 05 establishes the private persistence boundary for profile shadow,
-- claim, proof, contest, and ownership-period records.  Public/API mutators
-- are deliberately introduced by a later migration.
create schema if not exists profile;
create schema if not exists profile_private;
create schema if not exists profile_api;

create extension if not exists btree_gist with schema extensions;

-- The state enums are intentionally closed.  Other bounded values remain
-- text columns with table-local checks so the seven state types are the only
-- profile enum surface exposed by this migration.
do $$
begin
  if not exists (
    select 1
      from pg_catalog.pg_type t
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'profile' and t.typname = 'shadow_state'
  ) then
    create type profile.shadow_state as enum (
      'created', 'invited', 'suppressed', 'claimed', 'merged'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_catalog.pg_type t
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'profile' and t.typname = 'suppression_state'
  ) then
    create type profile.suppression_state as enum ('active', 'revoked');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_catalog.pg_type t
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'profile' and t.typname = 'invitation_state'
  ) then
    create type profile.invitation_state as enum (
      'queued', 'sent', 'failed_retryable', 'stopped'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_catalog.pg_type t
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'profile' and t.typname = 'claim_state'
  ) then
    create type profile.claim_state as enum (
      'started', 'proving', 'provisional', 'full', 'stalled',
      'withheld', 'contested', 'revoked'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_catalog.pg_type t
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'profile' and t.typname = 'proof_state'
  ) then
    create type profile.proof_state as enum (
      'pending', 'accepted', 'rejected', 'expired', 'superseded'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_catalog.pg_type t
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'profile' and t.typname = 'contest_state'
  ) then
    create type profile.contest_state as enum (
      'open', 'frozen', 'resolved', 'withdrawn'
    );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
      from pg_catalog.pg_type t
      join pg_catalog.pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'profile' and t.typname = 'ownership_period_state'
  ) then
    create type profile.ownership_period_state as enum (
      'active', 'ended', 'superseded', 'reversed'
    );
  end if;
end
$$;

-- One trigger function owns the cross-table invariants.  It is not an RPC:
-- only table-owned trigger execution can reach it.  State transitions are
-- explicit, versions are monotone CAS fences, and source/evidence identity
-- cannot be rewritten after admission.
create or replace function profile_private.profile_state_transition_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  old_state text;
  new_state text;
begin
  if tg_op = 'DELETE' then
    raise exception 'profile history is append-only: %', tg_table_name
      using errcode = 'P0001';
  end if;

  if new.version <= 0 then
    raise exception 'profile version must be positive'
      using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    if tg_table_name = 'shadow_party_contexts' then
      if new.owner_id is distinct from new.party_id then
        raise exception 'shadow owner_id must equal party_id'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'shadow_suppressions' then
      if not exists (
        select 1
          from profile_private.shadow_party_contexts c
         where c.id = new.owner_id
           and (new.party_id is null or c.party_id = new.party_id)
      ) then
        raise exception 'suppression owner_id must identify its shadow context'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'invitation_dispatches' then
      if new.owner_id is distinct from new.shadow_id then
        raise exception 'invitation owner_id must equal shadow_id'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'claim_cases' then
      if new.owner_id is distinct from new.target_party_id then
        raise exception 'claim owner_id must equal target_party_id'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'claim_proof_attempts' then
      if not exists (
        select 1
          from profile_private.claim_cases c
         where c.id = new.claim_id
           and c.target_party_id = new.owner_id
      ) then
        raise exception 'proof owner_id must equal claim target party'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'ownership_contests' then
      if new.owner_id is distinct from new.party_id then
        raise exception 'contest owner_id must equal party_id'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'party_ownership_periods' then
      if new.owner_id is distinct from new.party_id then
        raise exception 'ownership period owner_id must equal party_id'
          using errcode = '23514';
      end if;
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
     or new.owner_id is distinct from old.owner_id then
    raise exception 'profile identity and owner_id are immutable'
      using errcode = 'P0001';
  end if;

  if new.version <> old.version + 1 then
    raise exception 'profile version must advance exactly once'
      using errcode = 'P0001';
  end if;

  if tg_table_name = 'shadow_party_contexts' then
    if new.party_id is distinct from old.party_id
       or new.creator_person_id is distinct from old.creator_person_id
       or new.creator_acting_party_id is distinct from old.creator_acting_party_id
       or new.source_domain is distinct from old.source_domain
       or new.source_entity_id is distinct from old.source_entity_id
       or new.role_code is distinct from old.role_code
       or new.instrument_ref is distinct from old.instrument_ref
       or new.contact_route_id is distinct from old.contact_route_id then
      raise exception 'shadow source identity is immutable'
        using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'shadow_suppressions' then
    if new.party_id is distinct from old.party_id
       or new.route_fingerprint is distinct from old.route_fingerprint
       or new.remedy_action is distinct from old.remedy_action
       or new.scope is distinct from old.scope
       or new.case_id is distinct from old.case_id
       or new.evidence_ref is distinct from old.evidence_ref then
      raise exception 'suppression source and evidence identity is immutable'
        using errcode = 'P0001';
    end if;
    if not exists (
      select 1
        from profile_private.shadow_party_contexts c
       where c.id = new.owner_id
         and (new.party_id is null or c.party_id = new.party_id)
    ) then
      raise exception 'suppression owner_id must identify its shadow context'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'invitation_dispatches' then
    if new.shadow_id is distinct from old.shadow_id
       or new.route_id is distinct from old.route_id
       or new.attempt_no is distinct from old.attempt_no
       or new.trigger is distinct from old.trigger
       or new.scheduled_at is distinct from old.scheduled_at
       or (old.provider_ref is not null and new.provider_ref is distinct from old.provider_ref)
       or (old.provider_digest is not null and new.provider_digest is distinct from old.provider_digest) then
      raise exception 'invitation dispatch identity is immutable'
        using errcode = 'P0001';
    end if;
    if new.owner_id is distinct from new.shadow_id then
      raise exception 'invitation owner_id must equal shadow_id'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'claim_cases' then
    if new.target_party_id is distinct from old.target_party_id
       or new.claimant_person_id is distinct from old.claimant_person_id
       or new.claim_kind is distinct from old.claim_kind
       or new.recipient_person_id is distinct from old.recipient_person_id then
      raise exception 'claim source identity is immutable'
        using errcode = 'P0001';
    end if;
    if new.owner_id is distinct from new.target_party_id then
      raise exception 'claim owner_id must equal target_party_id'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'claim_proof_attempts' then
    if new.claim_id is distinct from old.claim_id
       or new.tier is distinct from old.tier
       or new.method is distinct from old.method
       or new.challenge_hash is distinct from old.challenge_hash
       or new.evidence_ref is distinct from old.evidence_ref
       or new.attester_ids is distinct from old.attester_ids
       or new.independence_result is distinct from old.independence_result
       or new.expires_at is distinct from old.expires_at then
      raise exception 'proof source and evidence fields are immutable'
        using errcode = 'P0001';
    end if;
    if not exists (
      select 1
        from profile_private.claim_cases c
       where c.id = new.claim_id
         and c.target_party_id = new.owner_id
    ) then
      raise exception 'proof owner_id must equal claim target party'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'ownership_contests' then
    if new.party_id is distinct from old.party_id
       or new.incumbent_claim_id is distinct from old.incumbent_claim_id
       or new.challenger_claim_id is distinct from old.challenger_claim_id then
      raise exception 'contest claim identity is immutable'
        using errcode = 'P0001';
    end if;
    if new.owner_id is distinct from new.party_id then
      raise exception 'contest owner_id must equal party_id'
        using errcode = '23514';
    end if;
  elsif tg_table_name = 'party_ownership_periods' then
    raise exception 'ownership periods are append-only history'
      using errcode = 'P0001';
  end if;

  old_state := pg_catalog.to_jsonb(old)->>'state';
  new_state := pg_catalog.to_jsonb(new)->>'state';

  if old_state is distinct from new_state
     and not (
       (tg_table_name = 'shadow_party_contexts'
        and old_state = 'created'
        and new_state = any (array['invited','suppressed','claimed','merged']))
       or (tg_table_name = 'shadow_suppressions'
        and old_state = 'active' and new_state = 'revoked')
       or (tg_table_name = 'invitation_dispatches'
        and (
          (old_state = 'queued' and new_state = any (array['sent','failed_retryable','stopped']))
          or (old_state = 'failed_retryable' and new_state = any (array['queued','sent','stopped']))
        ))
       or (tg_table_name = 'claim_cases'
        and (
          (old_state = 'started' and new_state = 'proving')
          or (old_state = 'proving' and new_state = any (array['provisional','full','stalled','withheld','contested']))
          or (old_state = 'provisional' and new_state = any (array['full','contested','revoked']))
          or (old_state = 'full' and new_state = any (array['contested','revoked']))
          or (old_state = 'stalled' and new_state = any (array['proving','withheld','contested']))
        ))
       or (tg_table_name = 'claim_proof_attempts'
        and old_state = 'pending'
        and new_state = any (array['accepted','rejected','expired','superseded']))
       or (tg_table_name = 'ownership_contests'
        and (
          (old_state = 'open' and new_state = any (array['resolved','frozen','withdrawn']))
          or (old_state = 'frozen' and new_state = 'resolved')
        ))
     ) then
    raise exception 'invalid profile state transition: %.% -> %',
      tg_table_name, old_state, new_state
      using errcode = 'P0001';
  end if;

  return new;
end
$function$;

create table if not exists profile_private.shadow_party_contexts (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null,
  party_id uuid not null,
  creator_person_id uuid not null,
  creator_acting_party_id uuid not null,
  source_domain text not null,
  source_entity_id text not null,
  role_code text,
  instrument_ref text,
  contact_route_id uuid,
  state profile.shadow_state not null default 'created',
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shadow_party_contexts_owner_party_ck
    check (owner_id = party_id),
  constraint shadow_party_contexts_version_ck
    check (version > 0),
  constraint shadow_party_contexts_source_domain_ck
    check (
      source_domain = lower(btrim(source_domain))
      and source_domain ~ '^[a-z][a-z0-9_.-]{0,63}$'
    ),
  constraint shadow_party_contexts_source_entity_ck
    check (
      char_length(source_entity_id) between 1 and 128
      and source_entity_id = btrim(source_entity_id)
      and source_entity_id !~ '[[:cntrl:]]'
    ),
  constraint shadow_party_contexts_state_ck
    check (state in ('created','invited','suppressed','claimed','merged'))
);

create table if not exists profile_private.shadow_suppressions (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null
    references profile_private.shadow_party_contexts(id) on delete restrict,
  party_id uuid,
  route_fingerprint bytea not null,
  remedy_action text not null,
  scope text not null,
  state profile.suppression_state not null default 'active',
  case_id uuid,
  evidence_ref text,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shadow_suppressions_version_ck
    check (version > 0),
  constraint shadow_suppressions_route_fingerprint_ck
    check (octet_length(route_fingerprint) = 32),
  constraint shadow_suppressions_remedy_action_ck
    check (remedy_action in ('suppress','correct')),
  constraint shadow_suppressions_scope_ck
    check (scope in ('outreach','publication','both')),
  constraint shadow_suppressions_state_ck
    check (state in ('active','revoked'))
);

create table if not exists profile_private.invitation_dispatches (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null
    references profile_private.shadow_party_contexts(id) on delete restrict,
  shadow_id uuid not null
    references profile_private.shadow_party_contexts(id) on delete restrict,
  route_id uuid not null,
  attempt_no integer not null,
  trigger text not null,
  state profile.invitation_state not null default 'queued',
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  provider_ref text,
  provider_digest bytea,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invitation_dispatches_owner_shadow_ck
    check (owner_id = shadow_id),
  constraint invitation_dispatches_attempt_ck
    check (attempt_no between 1 and 6),
  constraint invitation_dispatches_provider_digest_ck
    check (provider_digest is null or octet_length(provider_digest) = 32),
  constraint invitation_dispatches_version_ck
    check (version > 0),
  constraint invitation_dispatches_state_ck
    check (state in ('queued','sent','failed_retryable','stopped'))
);

create table if not exists profile_private.claim_cases (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null,
  target_party_id uuid not null,
  claimant_person_id uuid not null,
  claim_kind text not null,
  recipient_person_id uuid,
  state profile.claim_state not null default 'started',
  control_level text not null default 'none',
  proof_started_at timestamptz,
  proof_completed_at timestamptz,
  window_expires_at timestamptz,
  transfer_decision text,
  transfer_expires_at timestamptz,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claim_cases_owner_target_ck
    check (owner_id = target_party_id),
  constraint claim_cases_claim_kind_ck
    check (claim_kind in ('self','representation','transfer')),
  constraint claim_cases_control_level_ck
    check (control_level in ('none','provisional','full')),
  constraint claim_cases_transfer_decision_ck
    check (transfer_decision is null or transfer_decision in ('pending','accepted','declined','expired','blocked')),
  constraint claim_cases_version_ck
    check (version > 0),
  constraint claim_cases_state_ck
    check (state in ('started','proving','provisional','full','stalled','withheld','contested','revoked'))
);

create table if not exists profile_private.claim_proof_attempts (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null,
  claim_id uuid not null
    references profile_private.claim_cases(id) on delete restrict,
  tier text not null,
  method text not null,
  challenge_hash bytea,
  evidence_ref text,
  attester_ids uuid[] not null default '{}',
  independence_result text not null default 'pending',
  state profile.proof_state not null default 'pending',
  attempts_used integer not null default 0,
  expires_at timestamptz not null,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint claim_proof_attempts_tier_ck
    check (tier in ('A','B','C')),
  constraint claim_proof_attempts_method_ck
    check (method in ('domain_challenge','business_oauth','dsp_oauth','postal','business_phone','attester_route')),
  constraint claim_proof_attempts_challenge_hash_ck
    check (challenge_hash is null or octet_length(challenge_hash) = 32),
  constraint claim_proof_attempts_attesters_ck
    check (cardinality(attester_ids) <= 8),
  constraint claim_proof_attempts_independence_ck
    check (independence_result in ('pending','independent','not_independent','unknown')),
  constraint claim_proof_attempts_attempts_ck
    check (attempts_used between 0 and 5),
  constraint claim_proof_attempts_version_ck
    check (version > 0),
  constraint claim_proof_attempts_state_ck
    check (state in ('pending','accepted','rejected','expired','superseded'))
);

create table if not exists profile_private.ownership_contests (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null,
  party_id uuid not null,
  incumbent_claim_id uuid not null
    references profile_private.claim_cases(id) on delete restrict,
  challenger_claim_id uuid not null
    references profile_private.claim_cases(id) on delete restrict,
  state profile.contest_state not null default 'open',
  response_due_at timestamptz not null,
  resolution_basis text,
  winner_claim_id uuid
    references profile_private.claim_cases(id) on delete restrict,
  shard06_case_id uuid,
  reversal_end_at timestamptz,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ownership_contests_owner_party_ck
    check (owner_id = party_id),
  constraint ownership_contests_distinct_claims_ck
    check (incumbent_claim_id <> challenger_claim_id),
  constraint ownership_contests_resolution_ck
    check (state <> 'resolved' or winner_claim_id is not null),
  constraint ownership_contests_version_ck
    check (version > 0),
  constraint ownership_contests_state_ck
    check (state in ('open','frozen','resolved','withdrawn'))
);

create table if not exists profile_private.party_ownership_periods (
  id uuid primary key default extensions.gen_random_uuid(),
  owner_id uuid not null,
  party_id uuid not null,
  owner_person_id uuid not null,
  basis_kind text not null,
  basis_id uuid not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  control_level text not null,
  state profile.ownership_period_state not null default 'active',
  case_id uuid,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint party_ownership_periods_owner_party_ck
    check (owner_id = party_id),
  constraint party_ownership_periods_basis_ck
    check (basis_kind in ('claim','transfer','reversal')),
  constraint party_ownership_periods_control_ck
    check (control_level in ('provisional','full')),
  constraint party_ownership_periods_range_ck
    check (ends_at is null or ends_at > starts_at),
  constraint party_ownership_periods_live_end_ck
    check (state <> 'active' or ends_at is null),
  constraint party_ownership_periods_version_ck
    check (version > 0),
  constraint party_ownership_periods_state_ck
    check (state in ('active','ended','superseded','reversed'))
);

create unique index if not exists shadow_party_contexts_source_unique
  on profile_private.shadow_party_contexts (source_domain, source_entity_id, party_id);
create index if not exists shadow_party_contexts_party_state_idx
  on profile_private.shadow_party_contexts (party_id, state, updated_at desc);
create index if not exists shadow_party_contexts_creator_date_idx
  on profile_private.shadow_party_contexts (creator_person_id, created_at desc);

create unique index if not exists shadow_suppressions_active_unique
  on profile_private.shadow_suppressions (
    coalesce(party_id, '00000000-0000-0000-0000-000000000000'::uuid),
    route_fingerprint,
    scope
  )
  where state = 'active';
create index if not exists shadow_suppressions_route_state_idx
  on profile_private.shadow_suppressions (route_fingerprint, state);
create index if not exists shadow_suppressions_case_idx
  on profile_private.shadow_suppressions (case_id)
  where case_id is not null;

create unique index if not exists invitation_dispatches_shadow_route_attempt_unique
  on profile_private.invitation_dispatches (shadow_id, route_id, attempt_no);
create index if not exists invitation_dispatches_state_schedule_idx
  on profile_private.invitation_dispatches (state, scheduled_at);
create index if not exists invitation_dispatches_shadow_date_idx
  on profile_private.invitation_dispatches (shadow_id, created_at desc);

create unique index if not exists claim_cases_active_self_unique
  on profile_private.claim_cases (target_party_id, claimant_person_id)
  where claim_kind = 'self' and state not in ('revoked','stalled');
create index if not exists claim_cases_claimant_state_idx
  on profile_private.claim_cases (claimant_person_id, state);
create index if not exists claim_cases_target_state_version_idx
  on profile_private.claim_cases (target_party_id, state, version);
create index if not exists claim_cases_recipient_state_idx
  on profile_private.claim_cases (recipient_person_id, state)
  where recipient_person_id is not null;

create index if not exists claim_proof_attempts_claim_date_idx
  on profile_private.claim_proof_attempts (claim_id, created_at desc);
create unique index if not exists claim_proof_attempts_live_method_unique
  on profile_private.claim_proof_attempts (claim_id, method)
  where state = 'pending';
create index if not exists claim_proof_attempts_state_expiry_idx
  on profile_private.claim_proof_attempts (state, expires_at);
create index if not exists claim_proof_attempts_evidence_idx
  on profile_private.claim_proof_attempts (evidence_ref)
  where evidence_ref is not null;

-- Challenger identity is immutable on the claim row.  The derived immutable
-- key closes the target/person race without adding a second caller-controlled
-- person field to the contest record.  The claim-id expression remains visible
-- in the index definition for the storage contract while the derived person
-- key enforces the target/person meaning.
create or replace function profile_private.contest_challenger_person(p_claim_id uuid)
returns uuid
language sql
immutable
security definer
set search_path = ''
as $function$
  select c.claimant_person_id
    from profile_private.claim_cases c
   where c.id = p_claim_id
$function$;

create unique index if not exists ownership_contests_open_party_challenger_unique
  on profile_private.ownership_contests (
    party_id,
    profile_private.contest_challenger_person(challenger_claim_id)
  )
  where state = 'open';

create index if not exists ownership_contests_party_state_idx
  on profile_private.ownership_contests (party_id, state);
create index if not exists ownership_contests_response_state_idx
  on profile_private.ownership_contests (response_due_at, state);
create index if not exists ownership_contests_case_idx
  on profile_private.ownership_contests (shard06_case_id)
  where shard06_case_id is not null;

create index if not exists party_ownership_periods_party_date_idx
  on profile_private.party_ownership_periods (party_id, starts_at desc);
create index if not exists party_ownership_periods_owner_date_idx
  on profile_private.party_ownership_periods (owner_person_id, starts_at desc);
create index if not exists party_ownership_periods_basis_idx
  on profile_private.party_ownership_periods (basis_kind, basis_id);
alter table profile_private.party_ownership_periods
  add constraint party_ownership_periods_live_no_overlap
  exclude using gist (
    party_id with =,
    tstzrange(starts_at, coalesce(ends_at, 'infinity'::timestamptz), '[)') with &&
  )
  where (state = 'active');

-- Trigger names carry state/version/history vocabulary so the catalog can
-- prove that every record has the same mutation fence.
create trigger shadow_state_version_history_guard
before insert or update or delete on profile_private.shadow_party_contexts
for each row execute function profile_private.profile_state_transition_guard();
create trigger suppression_state_version_history_guard
before insert or update or delete on profile_private.shadow_suppressions
for each row execute function profile_private.profile_state_transition_guard();
create trigger invitation_state_version_history_guard
before insert or update or delete on profile_private.invitation_dispatches
for each row execute function profile_private.profile_state_transition_guard();
create trigger claim_state_version_history_guard
before insert or update or delete on profile_private.claim_cases
for each row execute function profile_private.profile_state_transition_guard();
create trigger proof_state_version_history_guard
before insert or update or delete on profile_private.claim_proof_attempts
for each row execute function profile_private.profile_state_transition_guard();
create trigger contest_state_version_history_guard
before insert or update or delete on profile_private.ownership_contests
for each row execute function profile_private.profile_state_transition_guard();
create trigger ownership_history_state_version_guard
before insert or update or delete on profile_private.party_ownership_periods
for each row execute function profile_private.profile_state_transition_guard();

alter table profile_private.shadow_party_contexts enable row level security;
alter table profile_private.shadow_party_contexts force row level security;
alter table profile_private.shadow_suppressions enable row level security;
alter table profile_private.shadow_suppressions force row level security;
alter table profile_private.invitation_dispatches enable row level security;
alter table profile_private.invitation_dispatches force row level security;
alter table profile_private.claim_cases enable row level security;
alter table profile_private.claim_cases force row level security;
alter table profile_private.claim_proof_attempts enable row level security;
alter table profile_private.claim_proof_attempts force row level security;
alter table profile_private.ownership_contests enable row level security;
alter table profile_private.ownership_contests force row level security;
alter table profile_private.party_ownership_periods enable row level security;
alter table profile_private.party_ownership_periods force row level security;

revoke all on schema profile_private from public, anon, authenticated, service_role;
revoke all on schema profile_api from public, anon, authenticated, service_role;
revoke all on function profile_private.profile_state_transition_guard()
  from public, anon, authenticated, service_role;
revoke all on function profile_private.contest_challenger_person(uuid)
  from public, anon, authenticated, service_role;

revoke all on table profile_private.shadow_party_contexts
  from public, anon, authenticated, service_role;
revoke all on table profile_private.shadow_suppressions
  from public, anon, authenticated, service_role;
revoke all on table profile_private.invitation_dispatches
  from public, anon, authenticated, service_role;
revoke all on table profile_private.claim_cases
  from public, anon, authenticated, service_role;
revoke all on table profile_private.claim_proof_attempts
  from public, anon, authenticated, service_role;
revoke all on table profile_private.ownership_contests
  from public, anon, authenticated, service_role;
revoke all on table profile_private.party_ownership_periods
  from public, anon, authenticated, service_role;

commit;
