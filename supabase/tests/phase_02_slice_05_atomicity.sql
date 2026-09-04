begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- P2-S05-AC-001, P2-S05-AC-002, P2-S05-AC-003, P2-S05-AC-009,
-- P2-S05-AC-015, P2-S05-AC-021, P2-S05-AC-027, P2-S05-AC-033,
-- P2-S05-AC-039, P2-S05-AC-045, P2-S05-AC-051, P2-S05-AC-107,
-- P2-S05-AC-108, P2-S05-AC-113, P2-S05-AC-114, P2-S05-AC-116,
-- P2-S05-AC-117, P2-S05-AC-122, P2-S05-AC-123, P2-S05-AC-125,
-- P2-S05-AC-126, P2-S05-AC-128, P2-S05-AC-129, P2-S05-AC-132,
-- P2-S05-AC-133, P2-S05-AC-135, P2-S05-AC-136, P2-S05-AC-137,
-- P2-S05-AC-257, P2-S05-AC-258.
--
-- BE00 owns the audit, outbox, and idempotency ledgers.  Slice 05 commands
-- must use those canonical tables in the same transaction as their domain
-- state; this file checks the integration boundary and failure guards.

select has_table('platform_private', 'idempotency_records',
  'canonical idempotency ledger exists');
select has_table('platform_private', 'outbox_events',
  'canonical outbox ledger exists');
select has_table('audit_private', 'audit_events',
  'canonical audit ledger exists');

select ok(
  (select count(*) = 3 and bool_and(relrowsecurity and relforcerowsecurity)
     from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where (n.nspname, c.relname) in (
      ('platform_private','idempotency_records'),
      ('platform_private','outbox_events'),
      ('audit_private','audit_events'))),
  'canonical ledgers force RLS');
select ok(
  (select count(*) = 9 and bool_and(
    not has_table_privilege(r.role_name, t.table_name, 'select')
    and not has_table_privilege(r.role_name, t.table_name, 'insert')
    and not has_table_privilege(r.role_name, t.table_name, 'update')
    and not has_table_privilege(r.role_name, t.table_name, 'delete'))
     from (values ('public'::name), ('anon'::name),
                  ('authenticated'::name)) r(role_name)
     cross join (values
       ('platform_private.idempotency_records'::text),
       ('platform_private.outbox_events'::text),
       ('audit_private.audit_events'::text)) t(table_name)),
  'canonical ledgers have no direct browser or public grants');

select has_column('platform_private', 'idempotency_records', 'actor_id',
  'idempotency binds actor');
select has_column('platform_private', 'idempotency_records', 'operation',
  'idempotency binds operation');
select has_column('platform_private', 'idempotency_records', 'key_hash',
  'idempotency stores hashed key');
select has_column('platform_private', 'idempotency_records', 'request_hash',
  'idempotency binds normalized request');
select has_column('platform_private', 'idempotency_records', 'state',
  'idempotency stores lifecycle state');
select has_column('platform_private', 'idempotency_records', 'response_ref',
  'idempotency stores replay reference');
select has_column('platform_private', 'idempotency_records', 'expires_at',
  'idempotency stores expiry');
select has_column('platform_private', 'outbox_events', 'event_type',
  'outbox stores event type');
select has_column('platform_private', 'outbox_events', 'schema_version',
  'outbox stores event schema version');
select has_column('platform_private', 'outbox_events', 'aggregate_type',
  'outbox stores aggregate type');
select has_column('platform_private', 'outbox_events', 'aggregate_id',
  'outbox stores aggregate id');
select has_column('platform_private', 'outbox_events', 'aggregate_version',
  'outbox stores aggregate version');
select has_column('platform_private', 'outbox_events', 'correlation_id',
  'outbox stores correlation id');
select has_column('platform_private', 'outbox_events', 'payload',
  'outbox stores bounded payload');
select has_column('audit_private', 'audit_events', 'actor_id',
  'audit stores actor id');
select has_column('audit_private', 'audit_events', 'acting_party_id',
  'audit stores acting party id');
select has_column('audit_private', 'audit_events', 'target_type',
  'audit stores target type');
select has_column('audit_private', 'audit_events', 'target_id',
  'audit stores target id');
select has_column('audit_private', 'audit_events', 'correlation_id',
  'audit stores correlation id');
select has_column('audit_private', 'audit_events', 'action',
  'audit stores action/event type');

select ok(
  exists (select 1 from pg_index i
    where i.indrelid = to_regclass('platform_private.idempotency_records')
      and i.indisunique
      and pg_get_indexdef(i.indexrelid) ~* '(actor_id|operation)'
      and pg_get_indexdef(i.indexrelid) ~* 'key_hash'),
  'idempotency key is unique for actor operation and key digest');
select ok(
  exists (select 1 from pg_trigger tr
    where tr.tgrelid = to_regclass('platform_private.idempotency_records')
      and not tr.tgisinternal
      and pg_get_triggerdef(tr.oid) ~* 'update|delete'),
  'idempotency records cannot be deleted or rewritten');
select ok(
  exists (select 1 from pg_trigger tr
    where tr.tgrelid = to_regclass('platform_private.outbox_events')
      and not tr.tgisinternal
      and pg_get_triggerdef(tr.oid) ~* 'update|delete'),
  'outbox events cannot be deleted or reopened');
select ok(
  exists (select 1 from pg_trigger tr
    where tr.tgrelid = to_regclass('audit_private.audit_events')
      and not tr.tgisinternal
      and pg_get_triggerdef(tr.oid) ~* 'update|delete'),
  'audit events are append-only');

-- Mutation implementations may be named with or without the profile prefix,
-- but all route/command operations must have an internal body that reserves
-- idempotency and writes paired audit/outbox effects.
create temp table p2_s05_mutator_names(name name primary key);
insert into p2_s05_mutator_names values
 ('rpc_match_shadow'), ('rpc_dispatch_invitation'), ('rpc_submit_remedy'),
 ('rpc_start_claim'), ('rpc_issue_claim_challenge'),
 ('rpc_submit_claim_proof'), ('rpc_convert_claim'),
 ('rpc_create_shadow_by_reference');

select ok(
  (select count(*) = 7 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ '(idempot|key_hash|request_hash)'
    and lower(pg_get_functiondef(p.oid)) ~ '(expected_version|version|for.update|advisory)'
    and lower(pg_get_functiondef(p.oid)) ~ '(audit|outbox)')
     from p2_s05_mutator_names r
     join pg_proc p on p.proname = r.name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'profile_private' and p.prokind = 'f'
      and r.name <> 'rpc_create_shadow_by_reference'),
  'profile mutation RPCs reserve idempotency, serialize CAS, and pair ledgers');
select ok(
  (select count(*) = 1 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ '(idempot|key_hash|request_hash)'
    and lower(pg_get_functiondef(p.oid)) ~ '(source|version|for.update|advisory)'
    and lower(pg_get_functiondef(p.oid)) ~ '(audit|outbox)')
     from p2_s05_mutator_names r
     join pg_proc p on p.proname = r.name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'profile_private' and p.prokind = 'f'
      and r.name = 'rpc_create_shadow_by_reference'),
  'shadow source command preserves idempotent audit/outbox atomicity');

-- Reads are projections only.  No RPC may expose private evidence, provider
-- payloads, challenge hashes, contact routes, or invitation work content.
select ok(
  not exists (select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'profile_private'
     and p.prokind = 'f'
     and lower(pg_get_functiondef(p.oid)) ~
       '(provider_response|challenge_code|pointer_token|evidence_body|work_title)'),
  'private RPC bodies do not return protected evidence or invitation content');

-- Canonical helper functions must fail closed when a restore/recovery fence is
-- active; Slice 05 must not create side effects outside BE00's atomic seam.
select ok(
  exists (select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'profile_private'
     and p.prokind = 'f'
     and lower(pg_get_functiondef(p.oid)) ~
       '(external_effects_allowed|restore|reconciliation|fence)'),
  'Slice 05 mutation path honors the canonical recovery fence');
select ok(
  not exists (select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'profile_private'
     and p.prokind = 'f'
     and lower(pg_get_functiondef(p.oid)) ~ '(http|fetch|provider.call|send.mail)'),
  'database transaction contains no external provider call');

select * from finish();
rollback;
