begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- P2-S06-AC-001..002, P2-S06-AC-021..032, P2-S06-AC-039..052,
-- P2-S06-AC-075..102, P2-S06-AC-111..121.
--
-- RED is intentionally catalog-safe: the Slice 06 migration is not present
-- yet, so missing relations produce failed assertions instead of aborting the
-- pgTAP transaction.  The DDL below mirrors BE02b exactly.

select ok(to_regnamespace('profiles') is not null,
  'profiles schema exists');

select has_table('profiles', 'profile_section_revisions',
  'profile section revisions relation exists');
select has_table('profiles', 'profile_section_heads',
  'profile section heads relation exists');
select has_table('profiles', 'profile_fact_projections',
  'profile fact projections relation exists');
select has_table('profiles', 'profile_projection_inbox',
  'profile projection inbox relation exists');
select has_table('profiles', 'profile_emphases',
  'profile emphases relation exists');
select has_table('profiles', 'reel_items',
  'reel items relation exists');

select ok((select c.relkind = 'v'
  from pg_class c where c.oid = to_regclass('profiles.public_profile_facts')),
  'viewer-safe public profile facts is a view');
select ok((select coalesce(array_to_string(c.reloptions, ','), '')
    ~ 'security_invoker=true'
  from pg_class c where c.oid = to_regclass('profiles.public_profile_facts')),
  'viewer-safe projection uses security invoker semantics');

-- Section history and heads.
select has_column('profiles', 'profile_section_revisions', 'id',
  'section revision has immutable identifier');
select has_column('profiles', 'profile_section_revisions', 'party_id',
  'section revision binds a party');
select has_column('profiles', 'profile_section_revisions', 'section_code',
  'section revision has asserted section code');
select has_column('profiles', 'profile_section_revisions', 'blocks',
  'section revision stores structured blocks');
select has_column('profiles', 'profile_section_revisions', 'author_person_id',
  'section revision stores human author');
select has_column('profiles', 'profile_section_revisions', 'acting_party_id',
  'section revision stores acting party');
select has_column('profiles', 'profile_section_revisions', 'state',
  'section revision stores lifecycle state');
select has_column('profiles', 'profile_section_revisions', 'version',
  'section revision stores positive version');
select has_column('profiles', 'profile_section_revisions', 'client_reason',
  'section revision stores bounded client reason');
select has_column('profiles', 'profile_section_revisions', 'created_at',
  'section revision stores creation time');
select has_column('profiles', 'profile_section_revisions', 'activated_at',
  'section revision stores activation time');
select has_column('profiles', 'profile_section_revisions', 'archived_at',
  'section revision stores archive time');
select has_column('profiles', 'profile_section_heads', 'party_id',
  'section head binds a party');
select has_column('profiles', 'profile_section_heads', 'section_code',
  'section head binds a section');
select has_column('profiles', 'profile_section_heads', 'active_revision_id',
  'section head points at active revision');
select has_column('profiles', 'profile_section_heads', 'latest_revision_id',
  'section head points at latest revision');
select has_column('profiles', 'profile_section_heads', 'version',
  'section head carries CAS version');
select has_column('profiles', 'profile_section_heads', 'updated_at',
  'section head carries update time');

select ok((select count(*) = 1 and bool_and(
    pg_catalog.format_type(a.atttypid, a.atttypmod) = 'text')
  from pg_attribute a
  where a.attrelid = to_regclass('profiles.profile_section_revisions')
    and a.attname = 'section_code'),
  'asserted section code is a text domain with four closed values');
select ok((select count(*) = 1 and bool_and(
    pg_catalog.format_type(a.atttypid, a.atttypmod) = 'jsonb')
  from pg_attribute a
  where a.attrelid = to_regclass('profiles.profile_section_revisions')
    and a.attname = 'blocks'),
  'section content is JSONB');

select has_index('profiles', 'profile_section_revisions',
  'profile_section_one_active',
  'one active revision is enforced per party and section');
select has_index('profiles', 'profile_section_revisions',
  'profile_section_history',
  'section history is indexed by party, section, and descending version');
select ok(exists (select 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_section_revisions')
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) ~* '\(party_id, section_code, version\)'),
  'section revision version is unique per party and section');
select ok(exists (select 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_section_heads')
    and c.contype = 'p'
    and pg_get_constraintdef(c.oid) ~* '\(party_id, section_code\)'),
  'section head primary key serializes one head per section');

-- Derived fact projection and bounded ingress.
select has_column('profiles', 'profile_fact_projections', 'party_id',
  'fact projection binds a party');
select has_column('profiles', 'profile_fact_projections', 'source_type',
  'fact projection records source type');
select has_column('profiles', 'profile_fact_projections', 'source_id',
  'fact projection records source identifier');
select has_column('profiles', 'profile_fact_projections', 'source_version',
  'fact projection records source version');
select has_column('profiles', 'profile_fact_projections', 'producer',
  'fact projection records registered producer');
select has_column('profiles', 'profile_fact_projections', 'provenance_state',
  'fact projection records provenance state');
select has_column('profiles', 'profile_fact_projections', 'evidence_class',
  'fact projection records evidence class');
select has_column('profiles', 'profile_fact_projections', 'evidence_count',
  'fact projection records bounded evidence count');
select has_column('profiles', 'profile_fact_projections', 'visibility',
  'fact projection records visibility');
select has_column('profiles', 'profile_fact_projections', 'embargo_until',
  'fact projection records embargo');
select has_column('profiles', 'profile_fact_projections', 'listing_state',
  'fact projection records listing state');
select has_column('profiles', 'profile_fact_projections', 'dispute_state',
  'fact projection records dispute state');
select has_column('profiles', 'profile_fact_projections', 'party_lifecycle',
  'fact projection records party lifecycle');
select has_column('profiles', 'profile_fact_projections', 'occurred_on',
  'fact projection records occurrence date');
select has_column('profiles', 'profile_fact_projections', 'role_codes',
  'fact projection records role taxonomy');
select has_column('profiles', 'profile_fact_projections', 'projection_payload',
  'fact projection stores bounded payload');
select has_column('profiles', 'profile_fact_projections', 'payload_schema_version',
  'fact projection stores payload schema version');
select has_column('profiles', 'profile_fact_projections', 'observed_at',
  'fact projection stores observation time');
select has_column('profiles', 'profile_fact_projections', 'applied_at',
  'fact projection stores apply time');
select has_column('profiles', 'profile_projection_inbox', 'message_id',
  'observation inbox deduplicates message ID');
select has_column('profiles', 'profile_projection_inbox', 'producer',
  'observation inbox binds producer');
select has_column('profiles', 'profile_projection_inbox', 'source_type',
  'observation inbox binds source type');
select has_column('profiles', 'profile_projection_inbox', 'source_id',
  'observation inbox binds source ID');
select has_column('profiles', 'profile_projection_inbox', 'source_version',
  'observation inbox binds source version');
select has_column('profiles', 'profile_projection_inbox', 'payload_hash',
  'observation inbox stores payload digest');
select has_column('profiles', 'profile_projection_inbox', 'processed_at',
  'observation inbox records processing time');
select has_column('profiles', 'profile_projection_inbox', 'failure_code',
  'observation inbox records quarantine code');

select ok(exists (select 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_fact_projections')
    and c.contype = 'p'
    and pg_get_constraintdef(c.oid) ~* '\(party_id, source_type, source_id\)'),
  'fact projection is keyed by party and source identity');
select ok(exists (select 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_projection_inbox')
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) ~* '\(producer, source_type, source_id, source_version\)'),
  'observation inbox has monotonic source dedupe key');
select has_index('profiles', 'profile_fact_projections',
  'profile_fact_public_record',
  'viewer-safe fact lookup index includes public eligibility');
select has_index('profiles', 'profile_fact_projections',
  'profile_fact_source_version',
  'fact source/version reconciliation index exists');

-- Emphasis and reel persistence.
select has_column('profiles', 'profile_emphases', 'party_id',
  'emphasis binds a party');
select has_column('profiles', 'profile_emphases', 'surface',
  'emphasis is scoped to the public profile surface');
select has_column('profiles', 'profile_emphases', 'default_filter',
  'emphasis stores optional filter');
select has_column('profiles', 'profile_emphases', 'ordered_refs',
  'emphasis stores ordered references');
select has_column('profiles', 'profile_emphases', 'actor_person_id',
  'emphasis stores actor');
select has_column('profiles', 'profile_emphases', 'acting_party_id',
  'emphasis stores acting party');
select has_column('profiles', 'profile_emphases', 'version',
  'emphasis carries CAS version');
select has_column('profiles', 'profile_emphases', 'updated_at',
  'emphasis carries update time');

select has_column('profiles', 'reel_items', 'id',
  'reel item has identifier');
select has_column('profiles', 'reel_items', 'party_id',
  'reel item binds a party');
select has_column('profiles', 'reel_items', 'credit_source_type',
  'reel item records credit source type');
select has_column('profiles', 'reel_items', 'credit_id',
  'reel item records credit ID');
select has_column('profiles', 'reel_items', 'credit_version',
  'reel item records credit version');
select has_column('profiles', 'reel_items', 'media_source_type',
  'reel item records media source type');
select has_column('profiles', 'reel_items', 'media_id',
  'reel item records governed media ID');
select has_column('profiles', 'reel_items', 'media_version',
  'reel item records governed media version');
select has_column('profiles', 'reel_items', 'role_code',
  'reel item carries role');
select has_column('profiles', 'reel_items', 'rights_basis',
  'reel item carries rights basis');
select has_column('profiles', 'reel_items', 'rights_source_type',
  'reel item records rights source type');
select has_column('profiles', 'reel_items', 'rights_id',
  'reel item records rights source ID');
select has_column('profiles', 'reel_items', 'rights_version',
  'reel item records rights version');
select has_column('profiles', 'reel_items', 'display_order',
  'reel item carries bounded display order');
select has_column('profiles', 'reel_items', 'state',
  'reel item carries rights lifecycle state');
select has_column('profiles', 'reel_items', 'state_reason',
  'reel item carries typed state reason');
select has_column('profiles', 'reel_items', 'actor_person_id',
  'reel item stores actor');
select has_column('profiles', 'reel_items', 'acting_party_id',
  'reel item stores acting party');
select has_column('profiles', 'reel_items', 'version',
  'reel item carries CAS version');
select has_column('profiles', 'reel_items', 'created_at',
  'reel item carries creation time');
select has_column('profiles', 'reel_items', 'updated_at',
  'reel item carries update time');
select has_index('profiles', 'reel_items', 'reel_public_order',
  'active reel rows have deterministic public order index');
select has_index('profiles', 'reel_items', 'reel_rights_lookup',
  'rights verifier can find active and pending reel rows');
select ok(exists (select 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.reel_items')
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) ~* '\(party_id, credit_id, media_id\)'),
  'reel item source tuple is unique per party');

-- Every base relation is an RLS boundary; no browser role receives direct
-- relation access.  CASE keeps this assertion safe while relations are absent.
select ok((select count(*) = 6 and bool_and(c.relrowsecurity and c.relforcerowsecurity)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'profiles'
    and c.relname in ('profile_section_revisions','profile_section_heads',
      'profile_fact_projections','profile_projection_inbox','profile_emphases',
      'reel_items')),
  'all Slice 06 base relations enable and force RLS');

select ok((select count(*) = 24 and bool_and(not has_table_privilege(
    r.role_name, t.table_name, 'select')
    and not has_table_privilege(r.role_name, t.table_name, 'insert')
    and not has_table_privilege(r.role_name, t.table_name, 'update')
    and not has_table_privilege(r.role_name, t.table_name, 'delete'))
  from (values ('public'::name), ('anon'::name), ('authenticated'::name),
               ('service_role'::name)) r(role_name)
  cross join (values
    ('profiles.profile_section_revisions'::text), ('profiles.profile_section_heads'::text),
    ('profiles.profile_fact_projections'::text), ('profiles.profile_projection_inbox'::text),
    ('profiles.profile_emphases'::text), ('profiles.reel_items'::text)) t(table_name)
  where to_regclass(t.table_name) is not null),
  'browser and service roles have no direct Slice 06 table grants');

-- The projection must filter all viewer-safety dimensions before exposing a
-- fact.  pg_get_viewdef returns NULL until the view is created, which is a
-- clean RED assertion rather than an execution error.
select ok((select pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
    ~* 'visibility.*public'
    and pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
      ~* 'listing_state.*listed'
    and pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
      ~* 'dispute_state.*withheld'
    and pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
      ~* 'party_lifecycle.*active'
    and pg_get_viewdef(to_regclass('profiles.public_profile_facts'))
      ~* 'embargo_until'
  ), 'public projection applies visibility, listing, dispute, lifecycle, and embargo filters');

select * from finish();
rollback;
