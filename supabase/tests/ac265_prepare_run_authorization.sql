begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

create temporary table ac265_prepare_run_fixtures (
  fixture_name text primary key,
  request jsonb not null
) on commit drop;

create temporary table ac265_candidate_fixtures (
  candidate_id uuid primary key,
  identity jsonb not null,
  identity_sha256 bytea not null
) on commit drop;

insert into ac265_candidate_fixtures (candidate_id, identity, identity_sha256)
select
  '10000000-0000-4000-8000-000000000010'::uuid,
  jsonb_build_object(
    'environment', 'staging',
    'ciRunId', '34751474024',
    'ciRunAttempt', 2,
    'stagingRunId', '34751910125',
    'stagingRunAttempt', 1,
    'sourceRevision', repeat('a', 40),
    'deploymentId', '6428523608',
    'deployedAt', '2026-09-14T01:01:00.000Z',
    'buildId', 'build-34751474024-2',
    'buildManifestSha256', repeat('c', 64),
    'artifactSha256', repeat('d', 64),
    'hostingAccountId', repeat('e', 32),
    'hostingProjectId', 'wejammin-staging',
    'supabaseProjectRef', 'abcdefghijklmnopqrst',
    'migrationVersion', '20260910023405',
    'migrationSha256', repeat('f', 64),
    'webOrigin', 'https://staging.wejamm.in',
    'apiOrigin', 'https://wejammin-api-staging.wejammin.workers.dev',
    'supabaseOrigin', 'https://abcdefghijklmnopqrst.supabase.co'
  ),
  decode(repeat('b', 64), 'hex');

insert into platform_private.ac265_verified_candidates (
  candidate_id, identity_sha256, source_revision, deployment_id,
  ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
  ci_artifact_id, staging_artifact_id, identity, provenance
)
select
  candidate.candidate_id,
  candidate.identity_sha256,
  candidate.identity ->> 'sourceRevision',
  candidate.identity ->> 'deploymentId',
  candidate.identity ->> 'ciRunId',
  (candidate.identity ->> 'ciRunAttempt')::integer,
  candidate.identity ->> 'stagingRunId',
  (candidate.identity ->> 'stagingRunAttempt')::integer,
  8801,
  9901,
  candidate.identity,
  '{}'::jsonb
from ac265_candidate_fixtures as candidate;

insert into platform_private.ac265_verified_candidates (
  candidate_id, identity_sha256, source_revision, deployment_id,
  ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
  ci_artifact_id, staging_artifact_id, identity, provenance
)
select
  '10000000-0000-4000-8000-000000000011'::uuid,
  decode(repeat('2', 64), 'hex'),
  candidate.identity ->> 'sourceRevision',
  '6428523609',
  candidate.identity ->> 'ciRunId',
  (candidate.identity ->> 'ciRunAttempt')::integer,
  '34751910126',
  1,
  8801,
  9902,
  jsonb_set(
    jsonb_set(candidate.identity, '{deploymentId}', to_jsonb('6428523609'::text)),
    '{stagingRunId}', to_jsonb('34751910126'::text)
  ),
  '{}'::jsonb
from ac265_candidate_fixtures as candidate;

insert into platform_private.ac265_verified_candidates (
  candidate_id, identity_sha256, source_revision, deployment_id,
  ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
  ci_artifact_id, staging_artifact_id, identity, provenance
)
select
  '10000000-0000-4000-8000-000000000012'::uuid,
  decode(repeat('3', 64), 'hex'),
  repeat('b', 40),
  '6428523610',
  '34751474025',
  2,
  '34751910127',
  1,
  8802,
  9903,
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(candidate.identity, '{sourceRevision}', to_jsonb(repeat('b', 40))),
        '{deploymentId}', to_jsonb('6428523610'::text)
      ),
      '{ciRunId}', to_jsonb('34751474025'::text)
    ),
    '{stagingRunId}', to_jsonb('34751910127'::text)
  ),
  '{}'::jsonb
from ac265_candidate_fixtures as candidate;

with instant as (
  select clock_timestamp() as at
), candidate as (
  select fixture.candidate_id, instant.at
  from ac265_candidate_fixtures as fixture
  cross join instant
  where fixture.candidate_id = '10000000-0000-4000-8000-000000000010'::uuid
), valid as (
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-control-plane-v1',
    'runId', '10000000-0000-4000-8000-000000000001',
    'candidateRef', 'ac265-candidate://staging/' || candidate.candidate_id::text,
    'github', jsonb_build_object(
      'issuer', 'https://token.actions.githubusercontent.com',
      'audience', 'urn:wejammin:ac265:staging-runner:v1',
      'subject', 'repo:WeJustJammin/nevrite-music:environment:staging',
      'repository', 'WeJustJammin/nevrite-music',
      'repositoryId', '1297208152',
      'repositoryOwner', 'WeJustJammin',
      'repositoryOwnerId', '305953066',
      'repositoryVisibility', 'public',
      'ref', 'refs/heads/main',
      'refProtected', true,
      'eventName', 'workflow_dispatch',
      'environment', 'staging',
      'runnerEnvironment', 'github-hosted',
      'workflowRef', 'WeJustJammin/nevrite-music/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main',
      'workflowSha', repeat('a', 40),
      'sha', repeat('a', 40),
      'githubRunId', '34796668543',
      'githubRunAttempt', 1,
      'jtiSha256', repeat('7', 64),
      'tokenIssuedAt', to_char((candidate.at - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'tokenNotBefore', to_char((candidate.at - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'tokenExpiresAt', to_char((candidate.at + interval '3 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  ) as request
  from candidate
)
insert into ac265_prepare_run_fixtures (fixture_name, request)
select 'valid', request from valid;

insert into ac265_prepare_run_fixtures (fixture_name, request)
select fixture.fixture_name, fixture.request
from ac265_prepare_run_fixtures as base
cross join lateral (values
  ('extra-top-level', base.request || jsonb_build_object('unexpected', true)),
  ('missing-github', base.request - 'github'),
  ('extra-identity-key', base.request || jsonb_build_object('identity', jsonb_build_object('unexpected', true))),
  ('extra-github-key', jsonb_set(base.request, '{github}', base.request -> 'github' || jsonb_build_object('unexpected', true))),
  ('production-identity', base.request || jsonb_build_object('identity', jsonb_build_object('environment', 'production'))),
  ('production-github-environment', jsonb_set(base.request, '{github,environment}', to_jsonb('production'::text))),
  ('wrong-repository-id', jsonb_set(base.request, '{github,repositoryId}', to_jsonb('1297208153'::text))),
  ('wrong-owner-id', jsonb_set(base.request, '{github,repositoryOwnerId}', to_jsonb('305953067'::text))),
  ('untrusted-api-origin', base.request || jsonb_build_object('identity', jsonb_build_object('apiOrigin', 'https://attacker.example'))),
  ('wrong-workflow-ref', jsonb_set(base.request, '{github,workflowRef}', to_jsonb('WeJustJammin/nevrite-music/.github/workflows/other.yml@refs/heads/main'::text))),
  ('unprotected-ref', jsonb_set(base.request, '{github,refProtected}', 'false'::jsonb)),
  ('non-main-ref', jsonb_set(base.request, '{github,ref}', to_jsonb('refs/heads/feature'::text))),
  ('self-hosted-runner', jsonb_set(base.request, '{github,runnerEnvironment}', to_jsonb('self-hosted'::text))),
  ('wrong-event', jsonb_set(base.request, '{github,eventName}', to_jsonb('push'::text))),
  ('wrong-audience', jsonb_set(base.request, '{github,audience}', to_jsonb('other-audience'::text))),
  ('revision-mismatch', jsonb_set(base.request, '{github,sha}', to_jsonb(repeat('b', 40)))),
  ('bad-identity-digest', base.request || jsonb_build_object('identitySha256', repeat('b', 63))),
  ('bad-jti-digest', jsonb_set(base.request, '{github,jtiSha256}', to_jsonb(repeat('g', 63)))),
  ('bad-artifact-digest', base.request || jsonb_build_object('identity', jsonb_build_object('artifactSha256', repeat('d', 63)))),
  ('unregistered-candidate', jsonb_set(base.request, '{candidateRef}', to_jsonb('ac265-candidate://staging/10000000-0000-4000-8000-000000000099'::text))),
  ('other-revision-candidate', jsonb_set(base.request, '{candidateRef}', to_jsonb('ac265-candidate://staging/10000000-0000-4000-8000-000000000012'::text))),
  ('invalid-candidate-ref', jsonb_set(base.request, '{candidateRef}', to_jsonb('not-a-candidate-reference'::text))),
  ('invalid-run-id', jsonb_set(base.request, '{runId}', to_jsonb('not-a-uuid'::text))),
  ('zero-github-run-id', jsonb_set(base.request, '{github,githubRunId}', to_jsonb('0'::text))),
  ('zero-github-attempt', jsonb_set(base.request, '{github,githubRunAttempt}', '0'::jsonb)),
  ('excessive-github-attempt', jsonb_set(base.request, '{github,githubRunAttempt}', '1001'::jsonb)),
  ('string-github-attempt', jsonb_set(base.request, '{github,githubRunAttempt}', to_jsonb('1'::text))),
  ('string-ref-protected', jsonb_set(base.request, '{github,refProtected}', to_jsonb('true'::text))),
  ('expired-token', jsonb_set(jsonb_set(jsonb_set(base.request, '{github,tokenIssuedAt}', to_jsonb(to_char((clock_timestamp() - interval '3 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))), '{github,tokenNotBefore}', to_jsonb(to_char((clock_timestamp() - interval '3 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))), '{github,tokenExpiresAt}', to_jsonb(to_char((clock_timestamp() - interval '1 minute') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))),
  ('overlong-token', jsonb_set(base.request, '{github,tokenExpiresAt}', to_jsonb(to_char((clock_timestamp() + interval '10 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))),
  ('future-issued-token', jsonb_set(jsonb_set(jsonb_set(base.request, '{github,tokenIssuedAt}', to_jsonb(to_char((clock_timestamp() + interval '1 hour') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))), '{github,tokenNotBefore}', to_jsonb(to_char((clock_timestamp() + interval '1 hour') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))), '{github,tokenExpiresAt}', to_jsonb(to_char((clock_timestamp() + interval '61 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))),
  ('future-not-before', jsonb_set(base.request, '{github,tokenNotBefore}', to_jsonb(to_char((clock_timestamp() + interval '1 minute') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))),
  ('changed-same-run', jsonb_set(base.request, '{github,githubRunAttempt}', '2'::jsonb)),
  ('changed-same-jti', jsonb_set(jsonb_set(base.request, '{runId}', to_jsonb('10000000-0000-4000-8000-000000000002'::text)), '{github,githubRunId}', to_jsonb('34796668544'::text))),
  ('changed-same-github-attempt', jsonb_set(jsonb_set(jsonb_set(base.request, '{runId}', to_jsonb('10000000-0000-4000-8000-000000000003'::text)), '{github,jtiSha256}', to_jsonb(repeat('8', 64))), '{github,tokenIssuedAt}', to_jsonb(to_char((clock_timestamp() - interval '20 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))),
  ('fresh-token-retry', jsonb_set(jsonb_set(jsonb_set(base.request, '{github,jtiSha256}', to_jsonb(repeat('9', 64))), '{github,tokenIssuedAt}', to_jsonb(to_char((clock_timestamp() - interval '20 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))), '{github,tokenNotBefore}', to_jsonb(to_char((clock_timestamp() - interval '20 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))),
  ('fresh-token-retry-after-expiry', jsonb_set(jsonb_set(jsonb_set(base.request, '{github,jtiSha256}', to_jsonb(repeat('5', 64))), '{github,tokenIssuedAt}', to_jsonb(to_char((clock_timestamp() - interval '20 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))), '{github,tokenNotBefore}', to_jsonb(to_char((clock_timestamp() - interval '20 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')))),
  ('changed-candidate-same-attempt', jsonb_set(jsonb_set(base.request, '{candidateRef}', to_jsonb('ac265-candidate://staging/10000000-0000-4000-8000-000000000011'::text)), '{github,jtiSha256}', to_jsonb(repeat('6', 64)))),
  ('replayed-retry-jti', jsonb_set(jsonb_set(jsonb_set(jsonb_set(base.request, '{runId}', to_jsonb('10000000-0000-4000-8000-000000000004'::text)), '{github,githubRunId}', to_jsonb('34796668544'::text)), '{github,githubRunAttempt}', '2'::jsonb), '{github,jtiSha256}', to_jsonb(repeat('9', 64))))
) as fixture(fixture_name, request)
where base.fixture_name = 'valid';

select ok(
  coalesce(
    has_function_privilege('service_role', to_regprocedure('platform_api.ac265_prepare_hosted_run(jsonb)'), 'execute'),
    false
  )
  and not coalesce(
    has_function_privilege('anon', to_regprocedure('platform_api.ac265_prepare_hosted_run(jsonb)'), 'execute'),
    true
  )
  and not coalesce(
    has_function_privilege('authenticated', to_regprocedure('platform_api.ac265_prepare_hosted_run(jsonb)'), 'execute'),
    true
  )
  and not coalesce(
    has_function_privilege('service_role', to_regprocedure('platform_private.ac265_prepare_hosted_run_candidate(jsonb)'), 'execute'),
    true
  ),
  'service_role can execute only the candidate-reference prepare RPC'
);

select ok(
  to_regclass('platform_private.ac265_runner_authorizations') is not null
  and coalesce(
    (select relrowsecurity and relforcerowsecurity
     from pg_catalog.pg_class
     where oid = to_regclass('platform_private.ac265_runner_authorizations')),
    false
  ),
  'runner authorization storage exists with enabled and forced RLS'
);

select ok(
  to_regclass('platform_private.ac265_runner_authorization_jtis') is not null
  and coalesce(
    (select relrowsecurity and relforcerowsecurity
     from pg_catalog.pg_class
     where oid = to_regclass('platform_private.ac265_runner_authorization_jtis')),
    false
  ),
  'JTI replay storage exists with enabled and forced RLS'
);

select ok(
  coalesce(
    not has_table_privilege('anon', to_regclass('platform_private.ac265_runner_authorizations'), 'select')
    and not has_table_privilege('authenticated', to_regclass('platform_private.ac265_runner_authorizations'), 'select')
    and not has_table_privilege('service_role', to_regclass('platform_private.ac265_runner_authorizations'), 'select')
    and not has_table_privilege('service_role', to_regclass('platform_private.ac265_runner_authorizations'), 'insert')
    and not has_table_privilege('service_role', to_regclass('platform_private.ac265_runner_authorizations'), 'update')
    and not has_table_privilege('service_role', to_regclass('platform_private.ac265_runner_authorizations'), 'delete')
    and not has_table_privilege('anon', to_regclass('platform_private.ac265_runner_authorization_jtis'), 'select')
    and not has_table_privilege('authenticated', to_regclass('platform_private.ac265_runner_authorization_jtis'), 'select')
    and not has_table_privilege('service_role', to_regclass('platform_private.ac265_runner_authorization_jtis'), 'select')
    and not has_table_privilege('service_role', to_regclass('platform_private.ac265_runner_authorization_jtis'), 'insert')
    and not has_table_privilege('service_role', to_regclass('platform_private.ac265_runner_authorization_jtis'), 'update')
    and not has_table_privilege('service_role', to_regclass('platform_private.ac265_runner_authorization_jtis'), 'delete'),
    false
  ),
  'no API role has direct runner-authorization table access'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_class as relation
    where relation.relnamespace = 'platform_private'::regnamespace
      and relation.relkind = 'S'
      and relation.relname like 'ac265_runner_authorizations%'
  ),
  'runner authorization identifiers do not create an exposed sequence'
);

set local role anon;
select throws_ok(
  $$select platform_api.ac265_prepare_hosted_run('{}'::jsonb)$$,
  '42501', null,
  'anon cannot execute the prepare-run RPC'
);
select throws_ok(
  $$select count(*) from platform_private.ac265_runner_authorizations$$,
  '42501', null,
  'anon cannot read runner-authorization rows'
);
select throws_ok(
  $$select count(*) from platform_private.ac265_runner_authorization_jtis$$,
  '42501', null,
  'anon cannot read JTI replay rows'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select platform_api.ac265_prepare_hosted_run('{}'::jsonb)$$,
  '42501', null,
  'authenticated cannot execute the prepare-run RPC'
);
reset role;

set local role service_role;
select throws_ok(
  $$select count(*) from platform_private.ac265_runner_authorizations$$,
  '42501', null,
  'service_role cannot read runner-authorization rows directly'
);
select throws_ok(
  $$select count(*) from platform_private.ac265_runner_authorization_jtis$$,
  '42501', null,
  'service_role cannot read JTI replay rows directly'
);
select throws_ok(
  $$insert into platform_private.ac265_runner_authorizations default values$$,
  '42501', null,
  'service_role cannot insert runner-authorization rows directly'
);
select throws_ok(
  $$insert into platform_private.ac265_runner_authorization_jtis default values$$,
  '42501', null,
  'service_role cannot insert JTI replay rows directly'
);
select throws_ok(
  $$select platform_private.ac265_prepare_hosted_run_candidate('{}'::jsonb)$$,
  '42501', null,
  'service_role cannot bypass candidate lookup through the private prepare implementation'
);
reset role;

select throws_ok(
  $$select platform_api.ac265_prepare_hosted_run(null::jsonb)$$,
  '22023', 'AC265 prepare-run request rejected',
  'null request is rejected'
);
select throws_ok(
  $$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'extra-top-level'))$$,
  '22023', 'AC265 prepare-run request rejected',
  'extra top-level keys are rejected'
);
select throws_ok(
  $$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'missing-github'))$$,
  '22023', 'AC265 prepare-run request rejected',
  'missing top-level keys are rejected'
);
select throws_ok(
  $$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'extra-identity-key'))$$,
  '22023', 'AC265 prepare-run request rejected',
  'prepare command rejects caller-supplied identity metadata'
);
select throws_ok(
  $$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'extra-github-key'))$$,
  '22023', 'AC265 prepare-run request rejected',
  'GitHub identity rejects extra keys'
);

select throws_ok($$select platform_api.ac265_prepare_hosted_run(jsonb_set((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'valid'), '{criterion}', to_jsonb('P2-S09-AC-209'::text)))$$, '22023', 'AC265 prepare-run request rejected', 'criterion is pinned');
select throws_ok($$select platform_api.ac265_prepare_hosted_run(jsonb_set((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'valid'), '{schemaVersion}', to_jsonb('ac265-hosted-control-plane-v0'::text)))$$, '22023', 'AC265 prepare-run request rejected', 'schema version is pinned');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'production-identity'))$$, '22023', 'AC265 prepare-run request rejected', 'production candidate identity is rejected');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'production-github-environment'))$$, '22023', 'AC265 prepare-run request rejected', 'production GitHub environment is rejected');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'wrong-repository-id'))$$, '22023', 'AC265 prepare-run request rejected', 'repository ID is pinned');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'wrong-owner-id'))$$, '22023', 'AC265 prepare-run request rejected', 'repository owner ID is pinned');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'untrusted-api-origin'))$$, '22023', 'AC265 prepare-run request rejected', 'only the approved staging Worker API origin is accepted');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'wrong-workflow-ref'))$$, '22023', 'AC265 prepare-run request rejected', 'protected workflow reference is pinned');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'unprotected-ref'))$$, '22023', 'AC265 prepare-run request rejected', 'unprotected refs are rejected');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'non-main-ref'))$$, '22023', 'AC265 prepare-run request rejected', 'non-main refs are rejected');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'self-hosted-runner'))$$, '22023', 'AC265 prepare-run request rejected', 'self-hosted runners are rejected');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'wrong-event'))$$, '22023', 'AC265 prepare-run request rejected', 'events other than workflow_dispatch are rejected');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'wrong-audience'))$$, '22023', 'AC265 prepare-run request rejected', 'OIDC audience is pinned');
select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'revision-mismatch')),
  '{"status":"conflict"}'::jsonb,
  'candidate source must match the OIDC SHA'
);
select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'unregistered-candidate')),
  '{"status":"conflict"}'::jsonb,
  'valid OIDC claims cannot prepare an unregistered candidate'
);
select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'other-revision-candidate')),
  '{"status":"conflict"}'::jsonb,
  'valid OIDC claims cannot prepare a registered candidate for a different source revision'
);
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'invalid-candidate-ref'))$$, '22023', 'AC265 prepare-run request rejected', 'candidate reference must use the exact staging URI form');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'bad-identity-digest'))$$, '22023', 'AC265 prepare-run request rejected', 'prepare command rejects caller-supplied identity digest');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'bad-jti-digest'))$$, '22023', 'AC265 prepare-run request rejected', 'JTI digest must be exactly 32 bytes');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'bad-artifact-digest'))$$, '22023', 'AC265 prepare-run request rejected', 'prepare command rejects caller-supplied candidate artifact metadata');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'invalid-run-id'))$$, '22023', 'AC265 prepare-run request rejected', 'run ID must be a UUID');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'zero-github-run-id'))$$, '22023', 'AC265 prepare-run request rejected', 'GitHub run ID must be positive');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'zero-github-attempt'))$$, '22023', 'AC265 prepare-run request rejected', 'GitHub run attempt must be positive');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'excessive-github-attempt'))$$, '22023', 'AC265 prepare-run request rejected', 'GitHub run attempt is bounded');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'string-github-attempt'))$$, '22023', 'AC265 prepare-run request rejected', 'GitHub run attempt must be a number');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'string-ref-protected'))$$, '22023', 'AC265 prepare-run request rejected', 'refProtected must be a boolean');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'expired-token'))$$, '22023', 'AC265 prepare-run request rejected', 'expired OIDC tokens are rejected');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'overlong-token'))$$, '22023', 'AC265 prepare-run request rejected', 'OIDC token lifetime cannot exceed five minutes');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'future-issued-token'))$$, '22023', 'AC265 prepare-run request rejected', 'future-issued OIDC tokens are rejected');
select throws_ok($$select platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'future-not-before'))$$, '22023', 'AC265 prepare-run request rejected', 'future not-before time is rejected');

create temporary table ac265_prepare_run_results (
  result_name text primary key,
  result jsonb not null
) on commit drop;

grant select on pg_temp.ac265_prepare_run_fixtures to service_role;
set local role service_role;
select is(
  (platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'valid')) ->> 'state'),
  'authorized',
  'service_role can create a scoped runner authorization'
);
reset role;

insert into ac265_prepare_run_results (result_name, result)
select 'first', platform_api.ac265_prepare_hosted_run(request)
from pg_temp.ac265_prepare_run_fixtures
where fixture_name = 'valid';

insert into ac265_prepare_run_results (result_name, result)
select 'repeat', platform_api.ac265_prepare_hosted_run(request)
from pg_temp.ac265_prepare_run_fixtures
where fixture_name = 'valid';

select is(
  (select result from pg_temp.ac265_prepare_run_results where result_name = 'repeat'),
  (select result from pg_temp.ac265_prepare_run_results where result_name = 'first'),
  'identical same-run request is idempotent'
);

insert into ac265_prepare_run_results (result_name, result)
select 'fresh-retry', platform_api.ac265_prepare_hosted_run(request)
from pg_temp.ac265_prepare_run_fixtures
where fixture_name = 'fresh-token-retry';

select is(
  (select result from pg_temp.ac265_prepare_run_results where result_name = 'fresh-retry'),
  (select result from pg_temp.ac265_prepare_run_results where result_name = 'first'),
  'fresh valid OIDC JTI and timestamps recover the same live authorization'
);

insert into ac265_prepare_run_results (result_name, result)
select 'fresh-retry-repeat', platform_api.ac265_prepare_hosted_run(request)
from pg_temp.ac265_prepare_run_fixtures
where fixture_name = 'fresh-token-retry';

select is(
  (select result from pg_temp.ac265_prepare_run_results where result_name = 'fresh-retry-repeat'),
  (select result from pg_temp.ac265_prepare_run_results where result_name = 'first'),
  'a retry JTI remains idempotent for its original immutable authority'
);

select ok(
  (select result ?& array[
        'criterion', 'schemaVersion', 'authorizationRef', 'runId',
        'identitySha256', 'sourceRevision', 'deploymentId', 'githubRunId',
        'githubRunAttempt', 'workflowSha', 'authorizedAt', 'expiresAt',
        'state', 'redacted'
      ]
      and (result - array[
        'criterion', 'schemaVersion', 'authorizationRef', 'runId',
        'identitySha256', 'sourceRevision', 'deploymentId', 'githubRunId',
        'githubRunAttempt', 'workflowSha', 'authorizedAt', 'expiresAt',
        'state', 'redacted'
      ]) = '{}'::jsonb
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-hosted-control-plane-v1'
      and result ->> 'authorizationRef' ~ '^ac265-authorization://staging/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and result ->> 'state' = 'authorized'
      and result ->> 'redacted' = 'true'
      and (result ->> 'expiresAt')::timestamptz > clock_timestamp()
      and (result ->> 'expiresAt')::timestamptz <= (result ->> 'authorizedAt')::timestamptz + interval '5 minutes'
   from pg_temp.ac265_prepare_run_results
   where result_name = 'first'),
  'authorization response exactly matches the redacted contract and expires within five minutes'
);

select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'changed-same-run')),
  '{"status":"conflict"}'::jsonb,
  'same run ID with different request bytes returns only the conflict sentinel'
);
select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'changed-same-jti')),
  '{"status":"conflict"}'::jsonb,
  'same OIDC JTI digest with different request bytes returns only the conflict sentinel'
);
select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'changed-same-github-attempt')),
  '{"status":"conflict"}'::jsonb,
  'same GitHub run attempt with different request bytes returns only the conflict sentinel'
);
select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'changed-candidate-same-attempt')),
  '{"status":"conflict"}'::jsonb,
  'same run and GitHub attempt with a changed candidate returns only the conflict sentinel'
);
select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'replayed-retry-jti')),
  '{"status":"conflict"}'::jsonb,
  'a retry JTI cannot authorize a different run or candidate'
);

update platform_private.ac265_runner_authorizations
set authorized_at = clock_timestamp() - interval '3 minutes',
    expires_at = clock_timestamp() - interval '1 minute'
where run_id = '10000000-0000-4000-8000-000000000001'::uuid;

select is(
  platform_api.ac265_prepare_hosted_run((select request from pg_temp.ac265_prepare_run_fixtures where fixture_name = 'fresh-token-retry-after-expiry')),
  '{"status":"conflict"}'::jsonb,
  'a fresh valid token cannot renew an expired authorization'
);

select ok(
  (select count(*) = 1
      and bool_and(expires_at <= clock_timestamp())
   from platform_private.ac265_runner_authorizations),
  'expired retry leaves the existing authorization expired without issuing a replacement'
);

select ok(
  (select count(*) = 1
      and bool_and(octet_length(identity_sha256) = 32)
      and bool_and(octet_length(jti_sha256) = 32)
      and bool_and(octet_length(request_sha256) = 32)
   from platform_private.ac265_runner_authorizations),
  'storage retains only fixed-size SHA-256 values for request, identity, and JTI'
);

select ok(
  (select count(*) = 2
      and count(distinct authorization_id) = 1
      and bool_and(octet_length(jti_sha256) = 32)
   from platform_private.ac265_runner_authorization_jtis),
  'each accepted JTI digest is replay-protected against the same authorization'
);

select ok(
  exists (
    select 1 from information_schema.columns
    where table_schema = 'platform_private'
      and table_name = 'ac265_runner_authorizations'
      and column_name = 'jti_sha256'
  )
  and not exists (
    select 1 from information_schema.columns
    where table_schema = 'platform_private'
      and table_name = 'ac265_runner_authorizations'
      and column_name in ('jti', 'jwt', 'oidc_token', 'request', 'payload')
  )
  and not exists (
    select 1 from information_schema.columns
    where table_schema = 'platform_private'
      and table_name = 'ac265_runner_authorization_jtis'
      and column_name in ('jti', 'jwt', 'oidc_token', 'request', 'payload')
  ),
  'storage has only the JTI digest and no raw JTI, JWT, request, or payload column'
);

select finish();
rollback;
