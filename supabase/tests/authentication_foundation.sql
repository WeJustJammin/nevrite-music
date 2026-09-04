begin;
select plan(52);

select has_schema('identity', 'identity schema exists');
select has_table('platform_private', 'party', 'party spine exists');
select has_table('platform_private', 'person_party', 'person identity exists');
select has_table('platform_private', 'acting_context_binding', 'self context exists');
select has_table('identity', 'auth_provider_registry', 'provider registry exists');
select has_table('identity', 'auth_user_bindings', 'Auth UUID binding exists');
select has_table('identity', 'auth_session_index', 'session index exists');
select has_table('identity', 'auth_intents', 'single-use auth intents exist');
select has_table('identity', 'auth_rate_limits', 'auth rate limits exist');
select has_table('identity', 'security_events', 'security evidence exists');

select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'identity.auth_user_bindings'::regclass),
  'bindings force RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'identity.auth_session_index'::regclass),
  'sessions force RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'identity.auth_intents'::regclass),
  'intents force RLS'
);
select ok(
  (select relrowsecurity and relforcerowsecurity from pg_class where oid = 'identity.security_events'::regclass),
  'security events force RLS'
);

select ok(not has_table_privilege('anon', 'identity.auth_user_bindings', 'select'), 'anon cannot read bindings');
select ok(not has_table_privilege('authenticated', 'identity.auth_session_index', 'select'), 'authenticated cannot read sessions');
select ok(not has_table_privilege('service_role', 'identity.auth_intents', 'select'), 'service role has no direct intent read');
select ok(not has_table_privilege('service_role', 'identity.security_events', 'update'), 'security evidence cannot be updated');

select has_function('platform_api', 'auth_provider_catalog', array[]::text[], 'provider catalog RPC exists');
select has_function('platform_api', 'auth_rate_limit', array['text','text','integer','integer'], 'rate RPC exists');
select has_function('platform_api', 'auth_intent_create', array['bytea','text','text','uuid','uuid','uuid','text','bytea','bytea','timestamptz','uuid','uuid'], 'intent create RPC exists');
select has_function('platform_api', 'auth_callback_complete', array['bytea','uuid','uuid','timestamptz','uuid','uuid'], 'callback completion RPC exists');
select has_function('platform_api', 'auth_session_read', array['uuid','uuid'], 'session read RPC exists');
select has_function('platform_api', 'auth_bootstrap', array['uuid','bytea','bytea','uuid','uuid'], 'bootstrap RPC exists');
select has_function('platform_api', 'auth_logout', array['uuid','uuid','text','bytea','bytea','uuid','uuid'], 'logout RPC exists');

select is((select count(*)::integer from identity.auth_provider_registry), 7, 'registry includes seven reviewed providers');
select is((select count(*)::integer from identity.auth_provider_registry where available_in_catalog), 5, 'catalog permits only five approved providers');
select is((select count(*)::integer from identity.auth_provider_registry where code in ('tiktok','bandlab') and not available_in_catalog), 2, 'unsupported providers remain absent');

select lives_ok(
  $$select platform_api.auth_rate_limit('AUTH-API-01', repeat('a', 64), 120, 60)$$,
  'rate decision is callable without direct table authority'
);
select is(
  (select (platform_api.auth_provider_catalog()->>'emailRecoveryEnabled')::boolean),
  true,
  'email recovery remains enabled'
);
select is(
  (select jsonb_array_length(platform_api.auth_provider_catalog()->'providers')),
  4,
  'catalog returns reviewed social providers only'
);
select ok(
  not (platform_api.auth_provider_catalog()::text ~* 'secret|token|subject|scope'),
  'catalog discloses no provider secret material'
);

select lives_ok(
  $$insert into auth.users(id) values ('71111111-1111-4111-8111-111111111111')$$,
  'bootstrap fixture Auth user is accepted'
);
select lives_ok(
  $$select platform_api.auth_bootstrap(
    '71111111-1111-4111-8111-111111111111', decode(repeat('ab', 32), 'hex'),
    decode(repeat('cd', 32), 'hex'), '71111111-1111-4111-8111-111111111112',
    '71111111-1111-4111-8111-111111111113'
  )$$,
  'first bootstrap succeeds'
);
select lives_ok(
  $$select platform_api.auth_bootstrap(
    '71111111-1111-4111-8111-111111111111', decode(repeat('ab', 32), 'hex'),
    decode(repeat('cd', 32), 'hex'), '71111111-1111-4111-8111-111111111112',
    '71111111-1111-4111-8111-111111111113'
  )$$,
  'bootstrap replay succeeds'
);
select is((select count(*)::integer from platform_private.party), 1, 'bootstrap creates exactly one party');
select is((select count(*)::integer from platform_private.person_party), 1, 'bootstrap creates exactly one person');
select is((select count(*)::integer from platform_private.acting_context_binding), 1, 'bootstrap creates exactly one self context');
select is((select count(*)::integer from identity.auth_user_bindings), 1, 'bootstrap creates exactly one Auth binding');
select is(
  (select count(*)::integer from audit_private.audit_events where action = 'identity.person.bootstrap'),
  1,
  'bootstrap writes one durable audit event'
);
select is(
  (select count(*)::integer from platform_private.outbox_events where event_type = 'identity.person.bootstrap.completed.v1'),
  1,
  'bootstrap writes one durable outbox event'
);
select lives_ok(
  $$select platform_api.auth_session_register(
    '71111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222221',
    clock_timestamp(), '71111111-1111-4111-8111-111111111112', '71111111-1111-4111-8111-111111111113'
  )$$,
  'first session registration succeeds'
);
select lives_ok(
  $$select platform_api.auth_session_register(
    '71111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222222',
    clock_timestamp(), '71111111-1111-4111-8111-111111111112', '71111111-1111-4111-8111-111111111113'
  )$$,
  'second session registration succeeds'
);
select lives_ok(
  $$select platform_api.auth_logout(
    '71111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222221',
    'current', decode(repeat('11', 32), 'hex'), decode(repeat('22', 32), 'hex'),
    '71111111-1111-4111-8111-111111111112', '71111111-1111-4111-8111-111111111113'
  )$$,
  'current-session logout succeeds'
);
select is((select count(*)::integer from identity.auth_session_index where state = 'revoked'), 1, 'current logout revokes exactly one session');
select is((select count(*)::integer from identity.auth_session_index where state = 'active'), 1, 'current logout preserves other sessions');
select ok(
  (select not (payload ? 'sessionId') from platform_private.outbox_events where event_type = 'identity.auth.logout.requested.v1' order by occurred_at desc limit 1),
  'logout outbox payload excludes raw session IDs'
);
select lives_ok(
  $$select platform_api.auth_logout(
    '71111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222222',
    'all', decode(repeat('33', 32), 'hex'), decode(repeat('44', 32), 'hex'),
    '71111111-1111-4111-8111-111111111112', '71111111-1111-4111-8111-111111111113'
  )$$,
  'global logout succeeds'
);
select is((select count(*)::integer from identity.auth_session_index where state = 'active'), 0, 'global logout revokes every remaining session');
select lives_ok(
  $$select platform_api.auth_logout(
    '71111111-1111-4111-8111-111111111111', '72222222-2222-4222-8222-222222222222',
    'all', decode(repeat('33', 32), 'hex'), decode(repeat('44', 32), 'hex'),
    '71111111-1111-4111-8111-111111111112', '71111111-1111-4111-8111-111111111113'
  )$$,
  'global logout replay succeeds without another effect'
);
select is(
  (select count(*)::integer from platform_private.outbox_events where event_type = 'identity.auth.logout.requested.v1'),
  2,
  'logout idempotency emits no duplicate provider effect'
);
select is(
  (select count(*)::integer from identity.security_events where action = 'identity.auth.logout'),
  2,
  'logout idempotency emits no duplicate security evidence'
);
select * from finish();
rollback;
