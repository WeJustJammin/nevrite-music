begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- P2-S06-AC-001..002, P2-S06-AC-003..020, P2-S06-AC-027..038,
-- P2-S06-AC-045..074, P2-S06-AC-103..119.
--
-- This suite exercises database behavior and state-machine fences.  Runtime
-- statements are wrapped by pgTAP so the pre-migration RED state reports
-- assertion failures rather than aborting the database harness on 42P01.

-- Section revision checks: asserted sections are structured, bounded, and
-- activate/archive through a single immutable history chain.
select throws_ok($$insert into profiles.profile_section_revisions(
    id, party_id, section_code, blocks, author_person_id, acting_party_id,
    state, version, client_reason, created_at
  ) values (
    'a0600000-0000-4000-8000-000000000001',
    'a0600000-0000-4000-8000-000000000002', 'reserved', '[]'::jsonb,
    'a0600000-0000-4000-8000-000000000003',
    'a0600000-0000-4000-8000-000000000002', 'draft', 1, 'test', now()
  )$$, '23514', null,
  'section code rejects attested or reserved sections');
select throws_ok($$insert into profiles.profile_section_revisions(
    id, party_id, section_code, blocks, author_person_id, acting_party_id,
    state, version, client_reason, created_at
  ) values (
    'a0600000-0000-4000-8000-000000000004',
    'a0600000-0000-4000-8000-000000000002', 'biography', '{}'::jsonb,
    'a0600000-0000-4000-8000-000000000003',
    'a0600000-0000-4000-8000-000000000002', 'draft', 1, 'test', now()
  )$$, '23514', null,
  'section blocks must be a JSON array');
select throws_ok($$insert into profiles.profile_section_revisions(
    id, party_id, section_code, blocks, author_person_id, acting_party_id,
    state, version, client_reason, created_at
  ) values (
    'a0600000-0000-4000-8000-000000000005',
    'a0600000-0000-4000-8000-000000000002', 'biography', '[]'::jsonb,
    'a0600000-0000-4000-8000-000000000003',
    'a0600000-0000-4000-8000-000000000002', 'draft', 0, 'test', now()
  )$$, '23514', null,
  'section revision version must be positive');
select throws_ok($$insert into profiles.profile_section_revisions(
    id, party_id, section_code, blocks, author_person_id, acting_party_id,
    state, version, client_reason, created_at
  ) values (
    'a0600000-0000-4000-8000-000000000006',
    'a0600000-0000-4000-8000-000000000002', 'biography', '[]'::jsonb,
    'a0600000-0000-4000-8000-000000000003',
    'a0600000-0000-4000-8000-000000000002', 'draft', 1, '', now()
  )$$, '23514', null,
  'section client reason cannot be empty');
select throws_ok($$insert into profiles.profile_section_revisions(
    id, party_id, section_code, blocks, author_person_id, acting_party_id,
    state, version, client_reason, created_at
  ) values (
    'a0600000-0000-4000-8000-000000000007',
    'a0600000-0000-4000-8000-000000000002', 'biography', '[]'::jsonb,
    'a0600000-0000-4000-8000-000000000003',
    'a0600000-0000-4000-8000-000000000002', 'active', 1, 'test', now()
  )$$, '23514', null,
  'active section revision requires activation timestamp');
select throws_ok($$insert into profiles.profile_section_revisions(
    id, party_id, section_code, blocks, author_person_id, acting_party_id,
    state, version, client_reason, created_at, activated_at
  ) values (
    'a0600000-0000-4000-8000-000000000008',
    'a0600000-0000-4000-8000-000000000002', 'biography', '[]'::jsonb,
    'a0600000-0000-4000-8000-000000000003',
    'a0600000-0000-4000-8000-000000000002', 'archived', 1, 'test', now(), now()
  )$$, '23514', null,
  'archived section revision requires archive timestamp');

select lives_ok($$insert into profiles.profile_section_revisions(
    id, party_id, section_code, blocks, author_person_id, acting_party_id,
    state, version, client_reason, created_at
  ) values (
    'a0600000-0000-4000-8000-000000000009',
    'a0600000-0000-4000-8000-000000000002', 'biography',
    '[{"kind":"paragraph","text":"A bounded assertion"}]'::jsonb,
    'a0600000-0000-4000-8000-000000000003',
    'a0600000-0000-4000-8000-000000000002', 'draft', 1, 'test', now()
  )$$, 'valid draft section revision can be stored');
select throws_ok($$update profiles.profile_section_revisions
  set blocks = '[{"kind":"paragraph","text":"rewritten"}]'::jsonb
  where id = 'a0600000-0000-4000-8000-000000000009'$$,
  'P0001', null, 'section revision content is immutable after insert');
select throws_ok($$update profiles.profile_section_revisions
  set author_person_id = 'a0600000-0000-4000-8000-000000000004'
  where id = 'a0600000-0000-4000-8000-000000000009'$$,
  'P0001', null, 'section revision author is immutable after insert');
select throws_ok($$delete from profiles.profile_section_revisions
  where id = 'a0600000-0000-4000-8000-000000000009'$$,
  'P0001', null, 'section revision history is append-only');

-- Catalog state machine and projection guards.
select ok((select count(*) = 1 from pg_trigger t
  where t.tgrelid = to_regclass('profiles.profile_section_revisions')
    and not t.tgisinternal
    and pg_get_triggerdef(t.oid) ~* '(immutable|history|revision|guard)'),
  'section revisions have an immutable history trigger');
select ok((select count(*) = 1 from pg_trigger t
  where t.tgrelid = to_regclass('profiles.profile_fact_projections')
    and not t.tgisinternal
    and pg_get_triggerdef(t.oid) ~* '(immutable|derived|projection|guard)'),
  'derived fact projections reject direct edits');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_section_revisions')
    and pg_get_constraintdef(c.oid) ~* 'section_code.*now.*biography.*services.*availability'),
  'section state admits only four asserted sections');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_section_revisions')
    and pg_get_constraintdef(c.oid) ~* 'draft.*active.*archived'),
  'section state machine is draft active archived');

-- Viewer-safe projections.  The view must be narrower than its source and
-- must never expose attester/evidence identity or protected payload columns.
select ok((select pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
    !~* '(attester|legal_identity|trader_address|consent|evidence_ref|token_hash|contact)'),
  'public profile view excludes protected identity and evidence fields');
select ok((select count(*) = 0 from pg_attribute a
  where a.attrelid = to_regclass('profiles.public_profile_facts')
    and not a.attisdropped
    and a.attname in ('attester_id','attester_person_id','legal_identity_id',
      'trader_address','consent_ref','evidence_ref','token_hash','contact_value')),
  'public profile view columns contain no protected fields');
select ok((select count(*) >= 8 from pg_attribute a
  where a.attrelid = to_regclass('profiles.public_profile_facts')
    and not a.attisdropped),
  'public profile view exposes bounded fact fields');
select ok((select pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
    ~* 'party_lifecycle.*active'
    and pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
      ~* 'visibility.*public'
    and pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
      ~* 'listing_state.*listed'
    and pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
      ~* 'dispute_state.*withheld'
    and pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
      ~* 'embargo_until'),
  'public projection applies every viewer eligibility predicate');

-- Emphasis cannot become authority or mutate the source credit projection.
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_emphases')
    and pg_get_constraintdef(c.oid) ~* 'surface.*public'),
  'emphasis surface includes the active public profile');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_emphases')
    and pg_get_constraintdef(c.oid) ~* 'jsonb_typeof\(ordered_refs\).*array'),
  'emphasis references are stored as a JSON array');
select ok((select count(*) = 1 from pg_trigger t
  where t.tgrelid = to_regclass('profiles.profile_emphases')
    and not t.tgisinternal
    and pg_get_triggerdef(t.oid) ~* '(version|cas|emphasis|guard)'),
  'emphasis writes have a durable CAS/version guard');

-- Reel rights and lifecycle.
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.reel_items')
    and pg_get_constraintdef(c.oid) ~* 'ownership.*licence.*provider_publication'),
  'reel rights basis is closed to governed choices');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.reel_items')
    and pg_get_constraintdef(c.oid) ~* 'draft.*verifying_rights.*active.*rejected.*takedown'),
  'reel lifecycle includes verification and reversible takedown');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.reel_items')
    and pg_get_constraintdef(c.oid) ~* 'display_order.*0.*999'),
  'reel display order is bounded');
select ok((select count(*) = 1 from pg_trigger t
  where t.tgrelid = to_regclass('profiles.reel_items')
    and not t.tgisinternal
    and pg_get_triggerdef(t.oid) ~* '(rights|state|version|guard)'),
  'reel transitions have a rights/version guard');
select ok((select pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
    !~* 'reel_items'),
  'portfolio projection remains separate from reel curation state');

-- RLS policies must bind actor/acting-party context and keep public reads on
-- the security-invoker projection.  Policy names are intentionally free-form.
select ok((select count(*) = 6 and bool_and(c.relrowsecurity and c.relforcerowsecurity)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'profiles'
    and c.relname in ('profile_section_revisions','profile_section_heads',
      'profile_fact_projections','profile_projection_inbox','profile_emphases',
      'reel_items')),
  'all Slice 06 base tables force RLS');
select ok((select count(*) >= 6 from pg_policies
  where schemaname = 'profiles'
    and tablename in ('profile_section_revisions','profile_section_heads',
      'profile_fact_projections','profile_projection_inbox','profile_emphases',
      'reel_items')),
  'every Slice 06 base table has an explicit RLS policy');
select ok((select count(*) > 0 and bool_and(
    coalesce(qual,'') ~* '(auth\.uid|actor|acting_party|mandate|producer|worker)'
    or coalesce(with_check,'') ~* '(auth\.uid|actor|acting_party|mandate|producer|worker)')
  from pg_policies
  where schemaname = 'profiles'
    and tablename in ('profile_section_revisions','profile_section_heads',
      'profile_fact_projections','profile_projection_inbox','profile_emphases',
      'reel_items')),
  'Slice 06 RLS policies use server-derived actor or worker context');

-- Operation implementation functions must be transactional and cannot issue
-- network calls.  Names remain implementation-flexible; the body vocabulary
-- is the durable contract supplied by BE00 and BE02b.
select ok((select count(*) > 0 and bool_and(
    pg_get_functiondef(p.oid) ~* '(profile|portfolio|reel|projection)'
    and pg_get_functiondef(p.oid) ~* '(idempot|key_hash|request_hash)'
    and pg_get_functiondef(p.oid) ~* '(version|for update|advisory|cas)'
    and pg_get_functiondef(p.oid) ~* '(audit|outbox)'
    and pg_get_functiondef(p.oid) !~* '(http|fetch\(|provider\.call|send\.mail)')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('profile_private','profile_api','platform_api')
    and p.prokind = 'f'
    and p.proname in (
      'profile_section_mutate', 'profile_emphasis_mutate',
      'profile_reel_mutate', 'profile_apply_observation')),
  'profile mutations reserve idempotency, serialize CAS, and pair audit/outbox atomically');

select * from finish();
rollback;
