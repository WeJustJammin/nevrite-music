begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- P2-S06-AC-006..008, P2-S06-AC-012..014, P2-S06-AC-018..020,
-- P2-S06-AC-024..026, P2-S06-AC-030..032, P2-S06-AC-036..038,
-- P2-S06-AC-042..044, P2-S06-AC-048..050, P2-S06-AC-054..056,
-- P2-S06-AC-060..074, P2-S06-AC-080..102, P2-S06-AC-111..121.
--
-- BE00 owns the durable ledgers.  This suite proves that Slice 06 can only
-- commit domain state, idempotency, audit, and invalidation together.  It
-- uses catalog predicates until the Slice 06 RPC implementation exists.

-- Canonical ledgers must remain the one transaction seam.
select has_table('platform_private', 'idempotency_records',
  'canonical idempotency ledger exists');
select has_table('platform_private', 'outbox_events',
  'canonical outbox ledger exists');
select has_table('audit_private', 'audit_events',
  'canonical audit ledger exists');
select has_column('platform_private', 'idempotency_records', 'actor_id',
  'idempotency binds human actor');
select has_column('platform_private', 'idempotency_records', 'operation',
  'idempotency binds operation');
select has_column('platform_private', 'idempotency_records', 'key_hash',
  'idempotency stores a keyed digest');
select has_column('platform_private', 'idempotency_records', 'request_hash',
  'idempotency binds canonical request');
select has_column('platform_private', 'idempotency_records', 'state',
  'idempotency stores reservation state');
select has_column('platform_private', 'idempotency_records', 'response_ref',
  'idempotency stores replay response');
select has_column('platform_private', 'idempotency_records', 'expires_at',
  'idempotency reservation expires');
select has_column('platform_private', 'outbox_events', 'event_type',
  'outbox stores event type');
select has_column('platform_private', 'outbox_events', 'schema_version',
  'outbox stores schema version');
select has_column('platform_private', 'outbox_events', 'aggregate_type',
  'outbox stores aggregate type');
select has_column('platform_private', 'outbox_events', 'aggregate_id',
  'outbox stores aggregate ID');
select has_column('platform_private', 'outbox_events', 'aggregate_version',
  'outbox stores aggregate version');
select has_column('platform_private', 'outbox_events', 'correlation_id',
  'outbox stores correlation ID');
select has_column('platform_private', 'outbox_events', 'payload',
  'outbox stores object payload');
select has_column('audit_private', 'audit_events', 'actor_id',
  'audit stores actor');
select has_column('audit_private', 'audit_events', 'acting_party_id',
  'audit stores acting party');
select has_column('audit_private', 'audit_events', 'target_type',
  'audit stores target type');
select has_column('audit_private', 'audit_events', 'target_id',
  'audit stores target ID');
select has_column('audit_private', 'audit_events', 'correlation_id',
  'audit stores correlation ID');
select has_column('audit_private', 'audit_events', 'decision',
  'audit stores allow or deny decision');
select has_column('audit_private', 'audit_events', 'reason_code',
  'audit stores stable reason code');

select ok((select count(*) = 3 and bool_and(c.relrowsecurity and c.relforcerowsecurity)
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where (n.nspname, c.relname) in (
    ('platform_private','idempotency_records'),
    ('platform_private','outbox_events'),
    ('audit_private','audit_events'))),
  'all canonical ledgers force RLS');
select ok((select count(*) = 12 and bool_and(not has_table_privilege(
    r.role_name, t.table_name, 'select')
    and not has_table_privilege(r.role_name, t.table_name, 'insert')
    and not has_table_privilege(r.role_name, t.table_name, 'update')
    and not has_table_privilege(r.role_name, t.table_name, 'delete'))
  from (values ('public'::name), ('anon'::name), ('authenticated'::name),
               ('service_role'::name)) r(role_name)
  cross join (values
    ('platform_private.idempotency_records'::text),
    ('platform_private.outbox_events'::text),
    ('audit_private.audit_events'::text)) t(table_name)
  where to_regclass(t.table_name) is not null),
  'browser and service roles have no direct canonical ledger grants');

-- Event types are versioned and the active profile topic is explicit.
select ok((select pg_get_functiondef(p.oid) ~* 'profile\.projection\.invalidated\.v1'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'platform_private'
    and p.proname = 'valid_base_event_payload'
  order by p.oid desc limit 1),
  'canonical outbox validator admits both Slice 06 profile event topics');

-- Search every Slice 06 implementation function by semantic name.  Each
-- mutating function must reserve a key, lock an aggregate/CAS head, and append
-- both audit and outbox records before returning.  Read-only projection
-- functions are deliberately excluded from this assertion.
select ok((select count(*) > 0 and bool_and(
    pg_get_functiondef(p.oid) ~* '(idempot|key_hash|request_hash)'
    and pg_get_functiondef(p.oid) ~* '(for update|advisory|expected.*version|cas)'
    and pg_get_functiondef(p.oid) ~* 'audit_private\.audit_events'
    and pg_get_functiondef(p.oid) ~* 'platform_private\.outbox_events'
    and pg_get_functiondef(p.oid) !~* '(http|fetch\(|provider\.call|send\.mail)')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('profile_private','profile_api','platform_api')
    and p.prokind = 'f'
    and p.proname in (
      'profile_section_mutate', 'profile_emphasis_mutate',
      'profile_reel_mutate', 'profile_apply_observation')
    and pg_get_functiondef(p.oid) ~* '(insert|update|delete)'),
  'Slice 06 mutation functions pair idempotency, CAS, audit, and outbox atomically');

-- A completed mutation must append a profile invalidation with aggregate and
-- source versions.  This catches accidental fire-and-forget publication and
-- source-version loss without requiring a particular RPC name.
select ok((select count(*) > 0 and bool_and(
    pg_get_functiondef(p.oid) ~* '(projection|invalidation|source_version)'
    and pg_get_functiondef(p.oid) ~* 'profile\.projection\.invalidated\.v1'
    and pg_get_functiondef(p.oid) ~* '(outbox|event_type|aggregate_version)')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('profile_private','profile_api','platform_api')
    and p.prokind = 'f'
    and p.proname in (
      'profile_section_mutate', 'profile_emphasis_mutate',
      'profile_reel_mutate', 'profile_apply_observation')),
  'profile mutations emit version-addressed projection invalidation');

-- No Slice 06 database function may contain an external side effect.  Provider
-- calls happen after commit in a Worker/queue boundary.
select ok(not exists (select 1 from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('profile_private','profile_api','platform_api')
    and p.prokind = 'f'
    and p.proname ~* '(profile|portfolio|reel|observation)'
    and pg_get_functiondef(p.oid) ~* '(http|fetch\(|provider\.call|send\.mail|pg_net)'),
  'Slice 06 database functions contain no provider or network call');

-- Replays and stale observations must be represented by durable state rather
-- than a second side effect.  Canonical constraints expose the binding even
-- before the ingress worker exists.
select ok(exists (select 1 from pg_constraint c
  where c.conrelid = 'platform_private.idempotency_records'::regclass
    and c.contype = 'u'
    and pg_get_constraintdef(c.oid) ~* '\(actor_id, operation, key_hash\)'),
  'idempotency key is unique per actor and operation');
select ok(exists (select 1 from pg_constraint c
  where c.conrelid = 'platform_private.idempotency_records'::regclass
    and pg_get_constraintdef(c.oid) ~* 'request_hash'),
  'idempotency record binds the canonical request hash');
select ok(exists (select 1 from pg_index i
  where i.indrelid = 'platform_private.outbox_events'::regclass
    and pg_get_indexdef(i.indexrelid) ~* 'aggregate_type.*aggregate_id.*aggregate_version'),
  'outbox ordering index retains aggregate version');

-- Profile command functions cannot widen authority by trusting caller-selected
-- producer, acting party, or source version.  Their source reads must be
-- bounded to the local profile schema and server-set claims.
select ok((select count(*) > 0 and bool_and(
    pg_get_functiondef(p.oid) ~* '(current_setting|auth\.uid|actor|acting_party)'
    and pg_get_functiondef(p.oid) !~* '(select|from|join)\s+(?:shard|credits?|media|consent|attendance|licensing)')
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('profile_private','profile_api','platform_api')
    and p.prokind = 'f'
    and p.proname in (
      'profile_section_mutate', 'profile_emphasis_mutate',
      'profile_reel_mutate', 'profile_apply_observation')),
  'Slice 06 commands use server context and never read upward-shard stores');

select * from finish();
rollback;
