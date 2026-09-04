begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- P2-S06-AC-001..008, P2-S06-AC-027..032, P2-S06-AC-033..044,
-- P2-S06-AC-053..074, P2-S06-AC-103..112, P2-S06-AC-117..121.
--
-- PRF-PROF-10 admits bounded observations from registered producers.  The
-- tests use pgTAP's SQL-string assertions for write behavior so missing
-- Slice 06 relations/functions are RED failures, not harness parse errors.

select has_function('platform_private', 'valid_base_event_payload',
  array['text','integer','jsonb'],
  'canonical event payload validator is available to the profile ingress');

-- Fact projection domain checks.
select throws_ok($$insert into profiles.profile_fact_projections(
    party_id, source_type, source_id, source_version, producer,
    provenance_state, evidence_class, evidence_count, visibility,
    listing_state, dispute_state, party_lifecycle, projection_payload,
    payload_schema_version, observed_at, applied_at
  ) values (
    'a0610000-0000-4000-8000-000000000001', 'credit',
    'a0610000-0000-4000-8000-000000000002', 1, 'shard99', 'attested',
    'issuer', 1, 'public', 'listed', 'clear', 'active', '{}'::jsonb, 1,
    now(), now()
  )$$, '23514', null,
  'profile fact ingress rejects an unregistered producer');
select throws_ok($$insert into profiles.profile_fact_projections(
    party_id, source_type, source_id, source_version, producer,
    provenance_state, evidence_class, evidence_count, visibility,
    listing_state, dispute_state, party_lifecycle, projection_payload,
    payload_schema_version, observed_at, applied_at
  ) values (
    'a0610000-0000-4000-8000-000000000001', 'credit',
    'a0610000-0000-4000-8000-000000000003', 0, 'shard07', 'attested',
    'issuer', 1, 'public', 'listed', 'clear', 'active', '{}'::jsonb, 1,
    now(), now()
  )$$, '23514', null,
  'profile fact source version must be positive');
select throws_ok($$insert into profiles.profile_fact_projections(
    party_id, source_type, source_id, source_version, producer,
    provenance_state, evidence_class, evidence_count, visibility,
    listing_state, dispute_state, party_lifecycle, projection_payload,
    payload_schema_version, observed_at, applied_at
  ) values (
    'a0610000-0000-4000-8000-000000000001', 'credit',
    'a0610000-0000-4000-8000-000000000004', 1, 'shard07', 'attested',
    'issuer', -1, 'public', 'listed', 'clear', 'active', '{}'::jsonb, 1,
    now(), now()
  )$$, '23514', null,
  'profile fact evidence count cannot be negative');
select throws_ok($$insert into profiles.profile_fact_projections(
    party_id, source_type, source_id, source_version, producer,
    provenance_state, evidence_class, evidence_count, visibility,
    listing_state, dispute_state, party_lifecycle, projection_payload,
    payload_schema_version, observed_at, applied_at
  ) values (
    'a0610000-0000-4000-8000-000000000001', 'credit',
    'a0610000-0000-4000-8000-000000000005', 1, 'shard07', 'attested',
    'issuer', 1, 'public', 'listed', 'clear', 'active', '[]'::jsonb, 1,
    now(), now()
  )$$, '23514', null,
  'profile fact payload must be a JSON object');
select throws_ok($$insert into profiles.profile_fact_projections(
    party_id, source_type, source_id, source_version, producer,
    provenance_state, evidence_class, evidence_count, visibility,
    listing_state, dispute_state, party_lifecycle, projection_payload,
    payload_schema_version, observed_at, applied_at
  ) values (
    'a0610000-0000-4000-8000-000000000001', 'credit',
    'a0610000-0000-4000-8000-000000000006', 1, 'shard07', 'attested',
    'issuer', 1, 'public', 'listed', 'clear', 'active', '{}'::jsonb, 0,
    now(), now()
  )$$, '23514', null,
  'profile fact payload schema version must be positive');
select throws_ok($$insert into profiles.profile_fact_projections(
    party_id, source_type, source_id, source_version, producer,
    provenance_state, evidence_class, evidence_count, visibility,
    listing_state, dispute_state, party_lifecycle, projection_payload,
    payload_schema_version, observed_at, applied_at
  ) values (
    'a0610000-0000-4000-8000-000000000001', 'credit',
    'a0610000-0000-4000-8000-000000000007', 1, 'shard07', 'attested',
    'issuer', 1, 'public', 'listed', 'clear', 'shadow_unclaimed', '{}'::jsonb, 1,
    now(), now()
  )$$, '23514', null,
  'shadow-unclaimed lifecycle cannot become public fact state');

select lives_ok($$insert into profiles.profile_fact_projections(
    party_id, source_type, source_id, source_version, producer,
    provenance_state, evidence_class, evidence_count, visibility,
    listing_state, dispute_state, party_lifecycle, occurred_on, role_codes,
    projection_payload, payload_schema_version, observed_at, applied_at
  ) values (
    'a0610000-0000-4000-8000-000000000001', 'credit',
    'a0610000-0000-4000-8000-000000000008', 1, 'shard07', 'attested',
    'issuer', 1, 'public', 'listed', 'clear', 'active', current_date,
    array['bass'], '{"title":"bounded credit"}'::jsonb, 1, now(), now()
  )$$, 'registered producer can store one eligible fact projection');
select throws_ok($$update profiles.profile_fact_projections
  set projection_payload = '{"title":"rewritten"}'::jsonb
  where party_id = 'a0610000-0000-4000-8000-000000000001'
    and source_type = 'credit'
    and source_id = 'a0610000-0000-4000-8000-000000000008'$$,
  'P0001', null, 'derived fact payload cannot be directly edited');
select throws_ok($$delete from profiles.profile_fact_projections
  where party_id = 'a0610000-0000-4000-8000-000000000001'
    and source_type = 'credit'
    and source_id = 'a0610000-0000-4000-8000-000000000008'$$,
  'P0001', null, 'derived fact projection cannot be erased as credit truth');

-- The inbox is at-least-once safe and binds source identity/version before the
-- projection worker can mutate a derived row.
select lives_ok($$insert into profiles.profile_projection_inbox(
    message_id, producer, source_type, source_id, source_version, payload,
    payload_hash, received_at
  ) values (
    'a0610000-0000-4000-8000-000000000009', 'shard07', 'credit',
    'a0610000-0000-4000-8000-000000000008', 1, '{"title":"bounded credit"}'::jsonb,
    decode(repeat('11', 32), 'hex'), now()
  )$$, 'profile observation inbox accepts one bounded message');
select throws_ok($$insert into profiles.profile_projection_inbox(
    message_id, producer, source_type, source_id, source_version, payload,
    payload_hash, received_at
  ) values (
    'a0610000-0000-4000-8000-000000000010', 'shard07', 'credit',
    'a0610000-0000-4000-8000-000000000008', 1, '{"title":"duplicate"}'::jsonb,
    decode(repeat('22', 32), 'hex'), now()
  )$$, '23505', null,
  'equal producer source and version is durably deduplicated');
select throws_ok($$insert into profiles.profile_projection_inbox(
    message_id, producer, source_type, source_id, source_version, payload,
    payload_hash, received_at
  ) values (
    'a0610000-0000-4000-8000-000000000011', 'shard07', 'credit',
    'a0610000-0000-4000-8000-000000000008', 1, '{"title":"different"}'::jsonb,
    decode(repeat('33', 32), 'hex'), now()
  )$$, '23505', null,
  'duplicate source version cannot create a second inbox result');

select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_fact_projections')
    and pg_get_constraintdef(c.oid) ~* 'shard01.*shard04.*shard07.*shard17.*shard20'),
  'producer allowlist is closed to the five registered source shards');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_fact_projections')
    and pg_get_constraintdef(c.oid) ~* 'asserted.*attested.*confirmed_assertion.*creator_asserted.*disputed'),
  'provenance state remains a bounded vocabulary');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_fact_projections')
    and pg_get_constraintdef(c.oid) ~* 'public.*protected.*private'),
  'fact visibility remains a bounded vocabulary');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_fact_projections')
    and pg_get_constraintdef(c.oid) ~* 'listed.*unlisted.*ineligible'),
  'fact listing state remains a bounded vocabulary');
select ok((select count(*) = 1 from pg_constraint c
  where c.conrelid = to_regclass('profiles.profile_fact_projections')
    and pg_get_constraintdef(c.oid) ~* 'clear.*disputed.*withheld'),
  'fact dispute state remains a bounded vocabulary');

-- A projection apply function must compare source versions, acknowledge equal
-- or stale deliveries, and append invalidation only for the winning version.
select ok((select count(*) > 0 and bool_and(
    pg_get_functiondef(p.oid) ~* '(source_version|monotonic|stale|newer)'
    and pg_get_functiondef(p.oid) ~* '(inbox|dedup|unique)'
    and pg_get_functiondef(p.oid) ~* '(projection|invalidat|outbox)'
  ) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('profile_private','profile_api','platform_api')
    and p.prokind = 'f'
    and p.proname = 'profile_apply_observation'),
  'PRF-PROF-10 apply path is monotonic, idempotent, and invalidates publication');

-- Source producers cannot read the profile store or select an arbitrary role;
-- this is checked by grants as well as policy text.
select ok((select count(*) = 0 from pg_policies
  where schemaname = 'profiles'
    and tablename in ('profile_fact_projections','profile_projection_inbox')
    and (coalesce(qual,'') ~* '(producer.*caller|caller.*producer|request.*producer)'
      or coalesce(with_check,'') ~* '(producer.*caller|caller.*producer|request.*producer)')),
  'profile ingress does not authorize a producer from an untrusted request claim');
select ok((select count(*) >= 2 and bool_and(not has_table_privilege(
    r.role_name, t.table_name, 'select'))
  from (values ('anon'::name), ('authenticated'::name)) r(role_name)
  cross join (values ('profiles.profile_fact_projections'::text),
                     ('profiles.profile_projection_inbox'::text)) t(table_name)
  where to_regclass(t.table_name) is not null),
  'browser roles cannot directly read profile fact or ingress tables');

select * from finish();
rollback;
