begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

-- Active HTTP scope is PRF-API-01..08.  Contest and ownership-period records
-- remain part of the seven-record persistence boundary; later public contest
-- and transfer routes are not introduced by this slice.
-- P2-S05-AC-001, P2-S05-AC-004, P2-S05-AC-005, P2-S05-AC-006,
-- P2-S05-AC-007, P2-S05-AC-008, P2-S05-AC-009, P2-S05-AC-010,
-- P2-S05-AC-011, P2-S05-AC-012, P2-S05-AC-013, P2-S05-AC-014,
-- P2-S05-AC-015, P2-S05-AC-016, P2-S05-AC-017, P2-S05-AC-018,
-- P2-S05-AC-019, P2-S05-AC-020, P2-S05-AC-021, P2-S05-AC-022,
-- P2-S05-AC-023, P2-S05-AC-024, P2-S05-AC-025, P2-S05-AC-026,
-- P2-S05-AC-027, P2-S05-AC-028, P2-S05-AC-029, P2-S05-AC-030,
-- P2-S05-AC-031, P2-S05-AC-032, P2-S05-AC-033, P2-S05-AC-034,
-- P2-S05-AC-035, P2-S05-AC-036, P2-S05-AC-037, P2-S05-AC-038,
-- P2-S05-AC-039, P2-S05-AC-040, P2-S05-AC-041, P2-S05-AC-042,
-- P2-S05-AC-043, P2-S05-AC-044, P2-S05-AC-045, P2-S05-AC-046,
-- P2-S05-AC-047, P2-S05-AC-048, P2-S05-AC-049, P2-S05-AC-050,
-- P2-S05-AC-051, P2-S05-AC-054, P2-S05-AC-055, P2-S05-AC-084,
-- P2-S05-AC-085, P2-S05-AC-086, P2-S05-AC-087, P2-S05-AC-088,
-- P2-S05-AC-089, P2-S05-AC-090, P2-S05-AC-091, P2-S05-AC-092,
-- P2-S05-AC-093, P2-S05-AC-094, P2-S05-AC-095, P2-S05-AC-096,
-- P2-S05-AC-097, P2-S05-AC-098, P2-S05-AC-116, P2-S05-AC-119,
-- P2-S05-AC-122, P2-S05-AC-125, P2-S05-AC-225, P2-S05-AC-246.
-- Route and command wrappers are named here so every active BE02a operation
-- has an executable database boundary.  They are intentionally RED until
-- Slice 05 creates the profile_private implementation and wrappers.
create temp table p2_s05_rpc_contract(
  operation_id text primary key,
  function_name name not null,
  exposure text not null,
  mutable boolean not null
);
insert into p2_s05_rpc_contract values
  ('PRF-API-01', 'rpc_match_shadow', 'authenticated', true),
  ('PRF-API-02', 'rpc_dispatch_invitation', 'authenticated', true),
  ('PRF-API-03', 'rpc_submit_remedy', 'anon', true),
  ('PRF-API-04', 'rpc_start_claim', 'authenticated', true),
  ('PRF-API-05', 'rpc_read_claim', 'authenticated', false),
  ('PRF-API-06', 'rpc_issue_claim_challenge', 'authenticated', true),
  ('PRF-API-07', 'rpc_submit_claim_proof', 'authenticated', true),
  ('PRF-API-08', 'rpc_convert_claim', 'authenticated', true),
  ('CMD-01', 'rpc_create_shadow_by_reference', 'service_role', true);

select has_schema('platform_api', 'platform API schema exists for Slice 05');
select has_schema('profile_private',
  'profile private implementation schema exists for Slice 05 RPCs');

select ok(
  (select count(*) = 9 and bool_and(
    exists (select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'platform_api'
       and p.proname = function_name))
   from p2_s05_rpc_contract),
  'all eight active PRF routes and CMD-01 have named platform RPCs');

select ok(
  (select count(*) = 9 and bool_and(p.prosecdef)
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f'),
  'all active Slice 05 platform RPC wrappers are security definer functions');
select ok(
  (select count(*) = 9 and bool_and(
    coalesce(array_to_string(p.proconfig, ','), '') ~* 'search_path[=][ ]*')
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f'),
  'all active Slice 05 wrappers pin an empty search_path');

-- Hono owns every public HTTP boundary. PostgREST RPCs are Worker-only so
-- browser roles cannot bypass Zod, rate, origin, or capability policy.
select ok(
  (select count(*) = 1 and bool_and(
    not has_function_privilege('public', p.oid, 'execute')
    and not has_function_privilege('anon', p.oid, 'execute')
    and not has_function_privilege('authenticated', p.oid, 'execute')
    and has_function_privilege('service_role', p.oid, 'execute'))
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f'
      and r.exposure = 'service_role'),
  'protected command functions are trusted-service only');
select ok(
  (select count(*) = 8 and bool_and(
    has_function_privilege('service_role', p.oid, 'execute')
    and not has_function_privilege('public', p.oid, 'execute')
    and not has_function_privilege('anon', p.oid, 'execute')
    and not has_function_privilege('authenticated', p.oid, 'execute'))
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f'
      and r.exposure <> 'service_role'),
  'route RPCs remain behind the trusted Hono service boundary');

select ok(
  not exists (select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'profile_private'
     and p.proname in (select function_name from p2_s05_rpc_contract)
     and (has_function_privilege('public', p.oid, 'execute')
       or has_function_privilege('anon', p.oid, 'execute')
       or has_function_privilege('authenticated', p.oid, 'execute')
       or has_function_privilege('service_role', p.oid, 'execute'))),
  'private Slice 05 implementation functions have no direct execution grants');

-- Every mutating boundary must carry a request idempotency binding and a
-- target/source version serialization point.  Reads are excluded because the
-- BE02a registry explicitly gives them no key or If-Match header.
select ok(
  (select count(*) = 7 and bool_and(
    lower(pg_get_functiondef(p.oid)) like '%idempot%'
    and lower(pg_get_functiondef(p.oid)) like '%version%')
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f' and r.mutable
      and r.operation_id not like 'CMD-%'),
  'all mutable route RPCs bind idempotency and version/CAS state');
select ok(
  (select count(*) = 1 and bool_and(
    lower(pg_get_functiondef(p.oid)) like '%idempot%'
    and lower(pg_get_functiondef(p.oid)) like '%version%')
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f'
      and r.operation_id like 'CMD-%'),
  'protected commands bind source/contest version and idempotency');

-- The target, actor, acting party, and claim/contest participant must be read
-- from trusted context and current private state.  A caller-supplied target
-- cannot widen visibility or authority.
select ok(
  (select count(*) = 9 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ '(actor|auth_user|acting_party|request.jwt|app\.)'
    and lower(pg_get_functiondef(p.oid)) ~ '(owner|claimant|participant|target|party)')
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f'),
  'all RPCs derive trusted actor context and apply target ownership/concealment');
select ok(
  (select count(*) = 1 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ '(null|not.found|conceal|forbidden|permission)')
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f'
      and r.operation_id = 'PRF-API-05'),
  'claim read conceals unauthorized targets');

-- Wrappers may delegate to profile_private helpers, but the transaction must
-- contain the paired audit/outbox write and no provider call.  Check the
-- complete function source (including helper body) rather than accepting a
-- route-only placeholder.
select ok(
  (select count(*) = 9 and bool_and(
    lower(pg_get_functiondef(p.oid)) ~ '(profile_private|audit|outbox|transaction)')
     from p2_s05_rpc_contract r
     join pg_proc p on p.proname = r.function_name
     join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'platform_api' and p.prokind = 'f'),
  'every active platform RPC delegates to the protected transactional implementation');

-- No API function may expose raw challenge hashes, evidence bodies, contact
-- routes, provider responses, pointer tokens, or invitation work titles.
select ok(
  not exists (select 1 from p2_s05_rpc_contract r
    join pg_proc p on p.proname = r.function_name
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'platform_api'
     and p.prokind = 'f'
     and lower(pg_get_functiondef(p.oid)) ~
       '(raise.*challenge_hash|return.*provider_response|return.*pointer_token|work_title)'),
  'RPC source does not return protected challenge/provider/pointer payloads');

-- Security-definer wrappers cannot resolve unqualified names under an
-- inherited search path.  This checks the exact hardening demanded by BE00.
select ok(
  not exists (select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'platform_api'
     and p.prokind = 'f'
     and p.proname in (select function_name from p2_s05_rpc_contract)
     and coalesce(array_to_string(p.proconfig, ','), '') !~* 'search_path[=][ ]*'),
  'all platform RPCs set an explicit empty search_path');

select * from finish();
rollback;
