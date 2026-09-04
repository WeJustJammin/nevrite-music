begin;
select plan(74);

select has_table('identity', 'login_identity_registry', 'login identity registry exists');
select has_table('identity', 'account_merge_cases', 'account merge cases exist');
select has_table('identity', 'account_merge_conflicts', 'merge conflict registry exists');
select has_table('identity', 'account_redirects', 'permanent account redirects exist');

select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'identity.login_identity_registry'::regclass), 'login identities force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'identity.account_merge_cases'::regclass), 'merge cases force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'identity.account_merge_conflicts'::regclass), 'merge conflicts force RLS');
select ok((select relrowsecurity and relforcerowsecurity from pg_class where oid = 'identity.account_redirects'::regclass), 'account redirects force RLS');

select ok(not has_table_privilege('anon', 'identity.login_identity_registry', 'select'), 'anon cannot read login identities');
select ok(not has_table_privilege('authenticated', 'identity.login_identity_registry', 'select'), 'authenticated cannot read login identities');
select ok(not has_table_privilege('anon', 'identity.account_merge_cases', 'select'), 'anon cannot read merge cases');
select ok(not has_table_privilege('authenticated', 'identity.account_merge_cases', 'select'), 'authenticated cannot read merge cases');
select ok(not has_table_privilege('service_role', 'identity.login_identity_registry', 'select'), 'service role has no direct login-identity read');
select ok(not has_table_privilege('service_role', 'identity.account_merge_cases', 'insert'), 'service role has no direct merge-case insert');
select ok(not has_table_privilege('service_role', 'identity.account_merge_conflicts', 'update'), 'service role has no direct merge-conflict update');
select ok(not has_table_privilege('service_role', 'identity.account_redirects', 'delete'), 'service role has no direct redirect delete');

select has_function('platform_api', 'auth_login_methods_read', array['uuid','uuid','uuid','uuid'], 'login-method read RPC exists');
select has_function('platform_api', 'auth_login_method_link_intent_create', array['uuid','uuid','text','text','bytea','bytea','bytea','timestamptz','bigint','bytea','bytea','uuid','uuid'], 'link-intent RPC exists');
select has_function('platform_api', 'auth_callback_fail', array['bytea','text','uuid','uuid'], 'callback-failure RPC exists');
select has_function('platform_api', 'auth_login_method_link_callback_complete', array['bytea','text','uuid','bytea','uuid','uuid'], 'link-callback RPC exists');
select has_function('platform_api', 'auth_login_method_unlink', array['uuid','uuid','uuid','text','bigint','bytea','bytea','uuid','uuid'], 'unlink RPC exists');
select has_function('platform_api', 'auth_account_merge_create', array['uuid','uuid','text','bigint','bytea','bytea','uuid','uuid'], 'merge-create RPC exists');
select has_function('platform_api', 'auth_account_merge_read', array['uuid','uuid','uuid','uuid','uuid'], 'merge-read RPC exists');
select has_function('platform_api', 'auth_account_merge_proof_create', array['uuid','uuid','uuid','text','text','bytea','bytea','bytea','timestamptz','bigint','bytea','bytea','uuid','uuid'], 'merge-proof RPC exists');
select has_function('platform_api', 'auth_account_merge_proof_callback_complete', array['bytea','text','uuid','bytea','uuid','uuid'], 'merge-proof callback RPC exists');
select has_function('platform_api', 'auth_account_merge_confirm', array['uuid','uuid','uuid','bigint','jsonb','bigint','bytea','bytea','uuid','uuid'], 'merge-confirm RPC exists');
select is(
  (select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'platform_api' and p.proname in ('auth_login_methods_read','auth_callback_fail','auth_login_method_link_intent_create','auth_login_method_link_callback_complete','auth_login_method_unlink','auth_account_merge_create','auth_account_merge_read','auth_account_merge_proof_create','auth_account_merge_proof_callback_complete','auth_account_merge_confirm') and p.prosecdef and 'search_path=""' = any(p.proconfig)),
  10,
  'every Slice 02 RPC is security definer with an empty fixed search path'
);

select lives_ok(
  $$insert into auth.users(id) values ('81111111-1111-4111-8111-111111111111')$$,
  'account-security fixture Auth user is accepted'
);
select lives_ok(
  $$select platform_api.auth_bootstrap(
    '81111111-1111-4111-8111-111111111111', decode(repeat('11', 32), 'hex'),
    decode(repeat('12', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'fixture person binding is bootstrapped'
);
select lives_ok(
  $$select platform_api.auth_session_register(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    clock_timestamp(), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'fixture session is registered'
);
select lives_ok(
  $$insert into identity.login_identity_registry(
    id, auth_user_id, provider, provider_subject_digest, state, label,
    verified_at, linked_at
  ) values
    ('85111111-1111-4511-8511-111111111111', '81111111-1111-4111-8111-111111111111',
     'email', decode(repeat('21', 32), 'hex'), 'linked', 'Email', clock_timestamp(), clock_timestamp()),
    ('86111111-1111-4611-8611-111111111111', '81111111-1111-4111-8111-111111111111',
     'google', decode(repeat('22', 32), 'hex'), 'linked', 'Google', clock_timestamp(), clock_timestamp())$$,
  'two verified recovery methods are installed'
);
select is(
  (select jsonb_array_length(platform_api.auth_login_methods_read(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )->'methods')),
  2,
  'login-method projection returns only the current account methods'
);
select ok(
  not (platform_api.auth_login_methods_read(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )::text ~* 'subject|email@|token|authUserId'),
  'login-method projection excludes provider subject, contact, token, and Auth UUID'
);
select lives_ok(
  $$select platform_api.auth_login_method_unlink(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    '86111111-1111-4611-8611-111111111111', 'provider_compromise', 1,
    decode(repeat('31', 32), 'hex'), decode(repeat('32', 32), 'hex'),
    '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )$$,
  'non-final login method enters provider reconciliation atomically'
);
select is((select count(*)::integer from identity.login_identity_registry where state = 'reconciling'), 1, 'exactly one method awaits provider reconciliation');
select is((select count(*)::integer from identity.login_identity_registry where state = 'linked'), 1, 'the recovery baseline remains linked');
select is((select version::integer from identity.auth_user_bindings where auth_user_id = '81111111-1111-4111-8111-111111111111'), 2, 'account security version advances once');
select is((select count(*)::integer from audit_private.audit_events where action = 'identity.login-method.unlink'), 1, 'unlink writes one audit event');
select is((select count(*)::integer from platform_private.outbox_events where event_type = 'identity.login-method.changed.v1'), 1, 'unlink writes one outbox event');
select is((select count(*)::integer from platform_private.provider_operations where operation_type = 'identity_unlink'), 1, 'unlink creates one governed provider operation');
select throws_ok(
  $$select platform_api.auth_login_method_unlink(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    '85111111-1111-4511-8511-111111111111', 'user_request', 2,
    decode(repeat('33', 32), 'hex'), decode(repeat('34', 32), 'hex'),
    '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )$$,
  'P0001', null, 'a reconciling credential cannot authorize removal of the final linked method'
);
select lives_ok(
  $$select platform_api.auth_login_method_unlink(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    '86111111-1111-4611-8611-111111111111', 'provider_compromise', 1,
    decode(repeat('31', 32), 'hex'), decode(repeat('32', 32), 'hex'),
    '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )$$,
  'same-key unlink replay returns the canonical result'
);
select is((select count(*)::integer from platform_private.outbox_events where event_type = 'identity.login-method.changed.v1'), 1, 'unlink replay emits no duplicate effect');
select lives_ok(
  $$select platform_api.auth_account_merge_create(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    '/settings/security', 2, decode(repeat('41', 32), 'hex'),
    decode(repeat('42', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'survivor creates a disclosure-safe merge case'
);
select is((select state::text from identity.account_merge_cases), 'awaiting_duplicate_proof', 'new merge awaits duplicate proof');
select lives_ok(
  $$select platform_api.auth_account_merge_create(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    '/settings/security', 2, decode(repeat('41', 32), 'hex'),
    decode(repeat('42', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'same-key merge replay returns the canonical case'
);
select is((select count(*)::integer from identity.account_merge_cases), 1, 'merge replay creates no duplicate case');
select is((select count(*)::integer from platform_private.outbox_events where event_type = 'identity.account-merge.changed.v1'), 1, 'merge replay emits no duplicate effect');
select is(
  (select platform_api.auth_account_merge_read(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    id, '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )->>'state' from identity.account_merge_cases limit 1),
  'awaiting_duplicate_proof',
  'survivor can read only the bounded merge projection'
);

select lives_ok(
  $$update identity.account_merge_cases set expires_at = clock_timestamp() - interval '1 second'$$,
  'merge expiry fixture advances beyond its bounded lifetime'
);
select throws_ok(
  $$select platform_api.auth_account_merge_proof_create(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    (select id from identity.account_merge_cases limit 1), 'google', '/settings/security',
    decode(repeat('51', 32), 'hex'), decode(repeat('52', 32), 'hex'),
    decode(repeat('53', 32), 'hex'), clock_timestamp() + interval '5 minutes', 1,
    decode(repeat('54', 32), 'hex'), decode(repeat('55', 32), 'hex'),
    '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )$$,
  'P0001', null, 'expired merge rejects duplicate proof before intent creation'
);
select is((select count(*)::integer from identity.auth_intents where intent = 'prove_merge'), 0, 'expired proof creates no intent');
select is(
  (select platform_api.auth_account_merge_read(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    id, '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )->>'state' from identity.account_merge_cases limit 1),
  'expired', 'bounded read transitions an elapsed merge to expired'
);
select lives_ok(
  $$select platform_api.auth_account_merge_create(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    '/settings/security', 2, decode(repeat('56', 32), 'hex'),
    decode(repeat('57', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'a new merge can start after the elapsed case expires'
);
select lives_ok(
  $$insert into auth.users(id) values ('81222222-2222-4222-8222-222222222222')$$,
  'duplicate-proof Auth user exists'
);
select lives_ok(
  $$select platform_api.auth_bootstrap(
    '81222222-2222-4222-8222-222222222222', decode(repeat('58', 32), 'hex'),
    decode(repeat('59', 32), 'hex'), '83222222-2222-4222-8222-222222222222',
    '84222222-2222-4222-8222-222222222222'
  )$$,
  'duplicate account obtains a protected person binding'
);
select lives_ok(
  $$select platform_api.auth_account_merge_proof_create(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    (select id from identity.account_merge_cases where state = 'awaiting_duplicate_proof' order by created_at desc limit 1),
    'email', '/settings/security', decode(repeat('61', 32), 'hex'),
    decode(repeat('62', 32), 'hex'), decode(repeat('63', 32), 'hex'),
    clock_timestamp() + interval '5 minutes', 1, decode(repeat('64', 32), 'hex'),
    decode(repeat('65', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'survivor creates a bound duplicate-proof intent'
);
select throws_ok(
  $$select platform_api.auth_account_merge_proof_callback_complete(
    decode(repeat('61', 32), 'hex'), 'apple', '81222222-2222-4222-8222-222222222222',
    decode(repeat('66', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'P0001', null, 'duplicate proof rejects a provider substitution'
);
select throws_ok(
  $$select platform_api.auth_account_merge_proof_callback_complete(
    decode(repeat('61', 32), 'hex'), 'email', '81111111-1111-4111-8111-111111111111',
    decode(repeat('66', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'P0001', null, 'duplicate proof rejects the survivor account'
);
select lives_ok(
  $$select platform_api.auth_account_merge_proof_callback_complete(
    decode(repeat('61', 32), 'hex'), 'email', '81222222-2222-4222-8222-222222222222',
    decode(repeat('66', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'a different controlled Auth UUID completes duplicate proof'
);
select is((select state::text from identity.account_merge_cases where state = 'analyzing'), 'analyzing', 'successful proof advances the merge to analyzing');
select is((select duplicate_auth_user_id::text from identity.account_merge_cases where state = 'analyzing'), '81222222-2222-4222-8222-222222222222', 'proof records only the different duplicate Auth UUID');
select is((select count(*)::integer from identity.auth_intents where intent = 'prove_merge' and state = 'consumed'), 1, 'duplicate proof is single use');
select lives_ok(
  $$update identity.account_merge_cases set expires_at = clock_timestamp() - interval '1 second' where state = 'analyzing'$$,
  'confirmation expiry fixture advances beyond its bounded lifetime'
);
select throws_ok(
  $$select platform_api.auth_account_merge_confirm(
    '81111111-1111-4111-8111-111111111111', '82111111-1111-4211-8211-111111111111',
    (select id from identity.account_merge_cases where state = 'analyzing'), 1,
    '["reviewed"]'::jsonb, 2, decode(repeat('67', 32), 'hex'),
    decode(repeat('68', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'P0001', null, 'expired merge rejects confirmation before job acceptance'
);
select is((select count(*)::integer from platform_private.jobs where job_type = 'identity.account.merge'), 0, 'expired confirmation creates no merge job');
select lives_ok(
  $$insert into identity.auth_intents(
    id, state_digest, intent, provider, auth_user_id, session_id, return_path,
    nonce_digest, pkce_verifier_digest, expires_at, state
  ) values (
    '87222222-2222-4722-8722-222222222222', decode(repeat('71', 32), 'hex'),
    'link', 'apple', '81111111-1111-4111-8111-111111111111',
    '82111111-1111-4211-8211-111111111111', '/settings/security',
    decode(repeat('72', 32), 'hex'), decode(repeat('73', 32), 'hex'),
    clock_timestamp() + interval '5 minutes', 'pending'
  )$$,
  'provider-link callback fixture is bound to the survivor session'
);
select throws_ok(
  $$select platform_api.auth_login_method_link_callback_complete(
    decode(repeat('71', 32), 'hex'), 'apple', '81222222-2222-4222-8222-222222222222',
    decode(repeat('74', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'P0001', null, 'provider link rejects account substitution'
);
select lives_ok(
  $$select platform_api.auth_login_method_link_callback_complete(
    decode(repeat('71', 32), 'hex'), 'apple', '81111111-1111-4111-8111-111111111111',
    decode(repeat('74', 32), 'hex'), '83111111-1111-4111-8111-111111111111',
    '84111111-1111-4111-8111-111111111111'
  )$$,
  'provider link finalizes for the initiating survivor only'
);
select is((select count(*)::integer from identity.login_identity_registry where provider = 'apple' and state = 'linked'), 1, 'provider link stores one digest-only verified method');
select is((select count(*)::integer from identity.auth_intents where id = '87222222-2222-4722-8722-222222222222' and state = 'consumed'), 1, 'provider-link callback is single use');
select lives_ok(
  $$insert into identity.auth_intents(
    id, state_digest, intent, provider, return_path, nonce_digest,
    pkce_verifier_digest, expires_at, state
  ) values (
    '88222222-2222-4822-8822-222222222222', decode(repeat('81', 32), 'hex'),
    'sign_in', 'google', '/auth/sign-in', decode(repeat('82', 32), 'hex'),
    decode(repeat('83', 32), 'hex'), clock_timestamp() + interval '5 minutes',
    'pending'
  )$$,
  'callback-failure fixture starts pending'
);
select lives_ok(
  $$select platform_api.auth_callback_fail(
    decode(repeat('81', 32), 'hex'), 'TOKEN_INVALID',
    '83111111-1111-4111-8111-111111111111', '84111111-1111-4111-8111-111111111111'
  )$$,
  'invalid provider evidence consumes the pending callback safely'
);
select is((select state::text from identity.auth_intents where id = '88222222-2222-4822-8822-222222222222'), 'failed', 'failed callback cannot be replayed as pending');

select * from finish();
rollback;
