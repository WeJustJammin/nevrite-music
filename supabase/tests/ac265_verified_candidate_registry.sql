begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regclass('platform_private.ac265_verified_candidates') is not null
  and coalesce(
    (select relrowsecurity and relforcerowsecurity
     from pg_catalog.pg_class
     where oid = to_regclass('platform_private.ac265_verified_candidates')),
    false
  ),
  'verified candidate storage exists with enabled and forced RLS'
);

select ok(
  to_regprocedure('platform_api.ac265_enroll_verified_candidate(jsonb)') is not null,
  'verified candidate enrollment RPC exists'
);

select ok(
  coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_enroll_verified_candidate(jsonb)'),
      'execute'
    ),
    false
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_enroll_verified_candidate(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_enroll_verified_candidate(jsonb)'),
      'execute'
    ),
    true
  ),
  'only service_role can execute the enrollment RPC'
);

select ok(
  not coalesce(
    has_table_privilege('anon', to_regclass('platform_private.ac265_verified_candidates'), 'select'),
    true
  )
  and not coalesce(
    has_table_privilege('authenticated', to_regclass('platform_private.ac265_verified_candidates'), 'select'),
    true
  )
  and not coalesce(
    has_table_privilege('service_role', to_regclass('platform_private.ac265_verified_candidates'), 'select'),
    true
  )
  and not coalesce(
    has_table_privilege('service_role', to_regclass('platform_private.ac265_verified_candidates'), 'insert'),
    true
  )
  and not coalesce(
    has_table_privilege('service_role', to_regclass('platform_private.ac265_verified_candidates'), 'update'),
    true
  )
  and not coalesce(
    has_table_privilege('service_role', to_regclass('platform_private.ac265_verified_candidates'), 'delete'),
    true
  ),
  'API roles have no direct verified candidate storage access'
);

create temporary table ac265_candidate_enrollment_fixtures (
  fixture_name text primary key,
  request jsonb not null
) on commit drop;

with candidate as (
  select jsonb_build_object(
    'environment', 'staging',
    'ciRunId', '34751474024',
    'ciRunAttempt', 2.0,
    'stagingRunId', '34751910125',
    'stagingRunAttempt', 1.0,
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
  ) as identity
), evidence as (
  select candidate.identity,
         jsonb_build_object(
           'repository', 'WeJustJammin/wejammin',
           'sourceRevision', candidate.identity ->> 'sourceRevision',
           'ci', jsonb_build_object(
             'runId', candidate.identity ->> 'ciRunId',
              'runAttempt', (candidate.identity ->> 'ciRunAttempt')::numeric::integer,
             'workflowPath', '.github/workflows/ci.yml',
             'artifactName', 'workspace-build-' || (candidate.identity ->> 'sourceRevision'),
             'artifactId', 8801,
             'artifactDigest', 'sha256:' || (candidate.identity ->> 'artifactSha256')
           ),
           'staging', jsonb_build_object(
             'runId', candidate.identity ->> 'stagingRunId',
              'runAttempt', (candidate.identity ->> 'stagingRunAttempt')::numeric::integer,
             'workflowPath', '.github/workflows/deploy-staging.yml',
             'artifactName', 'staging-verified-candidate',
             'artifactId', 9901,
             'artifactDigest', 'sha256:' || repeat('8', 64),
             'deploymentId', candidate.identity ->> 'deploymentId',
             'deployedAt', candidate.identity ->> 'deployedAt',
             'environment', 'staging',
             'webOrigin', candidate.identity ->> 'webOrigin',
             'apiOrigin', candidate.identity ->> 'apiOrigin'
           ),
           'artifact', jsonb_build_object(
             'buildId', candidate.identity ->> 'buildId',
             'buildManifestSha256', candidate.identity ->> 'buildManifestSha256',
             'migrationVersion', candidate.identity ->> 'migrationVersion'
           ),
           'migration', jsonb_build_object(
             'projectRef', candidate.identity ->> 'supabaseProjectRef',
             'remoteHistorySha256', candidate.identity ->> 'migrationSha256',
             'verifiedAt', '2026-09-14T01:04:00.000Z'
           ),
           'provider', jsonb_build_object(
             'evidenceSha256', repeat('9', 64),
             'collectedAt', '2026-09-14T01:05:00.000Z',
             'workers', jsonb_build_array(
               jsonb_build_object(
                 'workerName', 'wejammin-api-staging',
                 'versionId', '10000000-0000-4000-8000-000000000001',
                 'deploymentId', '10000000-0000-4000-8000-000000000002',
                 'versionCreatedAt', '2026-09-14T01:01:10.000Z',
                 'deploymentCreatedAt', '2026-09-14T01:02:00.000Z'
               ),
               jsonb_build_object(
                 'workerName', 'wejammin-web-staging',
                 'versionId', '10000000-0000-4000-8000-000000000003',
                 'deploymentId', '10000000-0000-4000-8000-000000000004',
                 'versionCreatedAt', '2026-09-14T01:01:10.000Z',
                 'deploymentCreatedAt', '2026-09-14T01:02:00.000Z'
               )
             )
           )
         ) as provenance
  from candidate
), valid as (
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-candidate-enrollment-v1',
    'identitySha256', 'e231f64b2e8d80d8be53d5ac180aa3aa782f17391cf1b7f5a8e1befcf28e6b50',
    'identity', evidence.identity,
    'provenance', evidence.provenance
  ) as request
  from evidence
)
insert into ac265_candidate_enrollment_fixtures (fixture_name, request)
select 'valid', request from valid;

insert into ac265_candidate_enrollment_fixtures (fixture_name, request)
select fixture.fixture_name, fixture.request
from ac265_candidate_enrollment_fixtures as base
cross join lateral (values
  ('extra-top-level', base.request || jsonb_build_object('unexpected', true)),
  ('caller-candidate-ref', base.request || jsonb_build_object('candidateRef', 'ac265-candidate://staging/10000000-0000-4000-8000-000000000099')),
  ('missing-identity-digest', base.request - 'identitySha256'),
  ('extra-identity-key', jsonb_set(base.request, '{identity}', base.request -> 'identity' || jsonb_build_object('unexpected', true))),
  ('extra-provenance-key', jsonb_set(base.request, '{provenance}', base.request -> 'provenance' || jsonb_build_object('unexpected', true))),
  ('forged-identity-digest', jsonb_set(base.request, '{identitySha256}', to_jsonb(repeat('b', 64)))),
  ('bad-identity-digest', jsonb_set(base.request, '{identitySha256}', to_jsonb(repeat('b', 63)))),
  ('untrusted-api-origin', jsonb_set(base.request, '{identity,apiOrigin}', to_jsonb('https://attacker.example'::text))),
  ('ci-source-artifact-mismatch', jsonb_set(base.request, '{provenance,ci,artifactDigest}', to_jsonb('sha256:' || repeat('0', 64)))),
  ('staging-deployment-mismatch', jsonb_set(base.request, '{provenance,staging,deploymentId}', to_jsonb('6428523609'::text))),
  ('migration-project-mismatch', jsonb_set(base.request, '{provenance,migration,projectRef}', to_jsonb('zyxwvutsrqponmlkjihg'::text))),
  ('provider-missing-worker', jsonb_set(base.request, '{provenance,provider,workers}', jsonb_build_array(jsonb_build_object('workerName', 'wejammin-api-staging'))))
) as fixture(fixture_name, request)
where base.fixture_name = 'valid';

create temporary table ac265_candidate_enrollment_results (
  result_name text primary key,
  result jsonb not null
) on commit drop;

grant select on ac265_candidate_enrollment_fixtures to service_role;
grant insert, select on ac265_candidate_enrollment_results to service_role;

set local role anon;
select throws_ok(
  $$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'valid'))$$,
  '42501', null,
  'anon cannot enroll verified candidates'
);
select throws_ok(
  $$select count(*) from platform_private.ac265_verified_candidates$$,
  '42501', null,
  'anon cannot read verified candidate rows'
);
reset role;

set local role authenticated;
select throws_ok(
  $$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'valid'))$$,
  '42501', null,
  'authenticated cannot enroll verified candidates'
);
reset role;

set local role service_role;
select throws_ok(
  $$select count(*) from platform_private.ac265_verified_candidates$$,
  '42501', null,
  'service_role cannot read verified candidate rows directly'
);
select throws_ok(
  $$insert into platform_private.ac265_verified_candidates default values$$,
  '42501', null,
  'service_role cannot insert verified candidate rows directly'
);
select throws_ok(
  $$update platform_private.ac265_verified_candidates set deployment_id = 'mutation'$$,
  '42501', null,
  'service_role cannot mutate verified candidate rows directly'
);
select throws_ok(
  $$delete from platform_private.ac265_verified_candidates$$,
  '42501', null,
  'service_role cannot revoke verified candidate rows directly'
);
select throws_ok(
  $$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'forged-identity-digest'))$$,
  '22023', 'AC265 candidate enrollment request rejected',
  'the RPC rejects a forged same-length identity digest after recomputing the canonical digest'
);
insert into ac265_candidate_enrollment_results (result_name, result)
select 'first', platform_api.ac265_enroll_verified_candidate(request)
from pg_temp.ac265_candidate_enrollment_fixtures
where fixture_name = 'valid';
insert into ac265_candidate_enrollment_results (result_name, result)
select 'repeat', platform_api.ac265_enroll_verified_candidate(request)
from pg_temp.ac265_candidate_enrollment_fixtures
where fixture_name = 'valid';
reset role;

select is(
  (select result from pg_temp.ac265_candidate_enrollment_results where result_name = 'repeat'),
  (select result from pg_temp.ac265_candidate_enrollment_results where result_name = 'first'),
  'identical enrollment returns the same immutable candidate reference'
);

select ok(
  (select result ?& array['criterion', 'schemaVersion', 'candidateRef', 'identitySha256', 'status', 'redacted']
      and (result - array['criterion', 'schemaVersion', 'candidateRef', 'identitySha256', 'status', 'redacted']) = '{}'::jsonb
      and result ->> 'criterion' = 'P2-S09-AC-265'
      and result ->> 'schemaVersion' = 'ac265-candidate-enrollment-v1'
      and result ->> 'candidateRef' ~ '^ac265-candidate://staging/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
       and result ->> 'identitySha256' = 'e231f64b2e8d80d8be53d5ac180aa3aa782f17391cf1b7f5a8e1befcf28e6b50'
      and result ->> 'status' = 'enrolled'
      and result ->> 'redacted' = 'true'
   from pg_temp.ac265_candidate_enrollment_results
   where result_name = 'first'),
   'valid JS-equivalent digest enrolls and returns only the strict redacted schema and server-generated reference'
);

select ok(
  (select count(*) = 1
      and bool_and(identity = (select request -> 'identity' from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'valid'))
      and bool_and(provenance = (select request -> 'provenance' from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'valid'))
       and bool_and(encode(identity_sha256, 'hex') = 'e231f64b2e8d80d8be53d5ac180aa3aa782f17391cf1b7f5a8e1befcf28e6b50')
   from platform_private.ac265_verified_candidates),
   'registry privately retains the complete identity and provenance tuple with its server-verified digest'
);

create temporary table ac265_registered_prepare_fixtures (
  fixture_name text primary key,
  request jsonb not null
) on commit drop;

with instant as (
  select clock_timestamp() as at
), candidate as (
  select result ->> 'candidateRef' as candidate_ref
  from ac265_candidate_enrollment_results
  where result_name = 'first'
), valid as (
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-control-plane-v1',
    'runId', '10000000-0000-4000-8000-000000000020',
    'candidateRef', candidate.candidate_ref,
    'github', jsonb_build_object(
      'issuer', 'https://token.actions.githubusercontent.com',
      'audience', 'urn:wejammin:ac265:staging-runner:v1',
      'subject', 'repo:WeJustJammin@305953066/wejammin@1297208152:environment:staging',
      'repository', 'WeJustJammin/wejammin',
      'repositoryId', '1297208152',
      'repositoryOwner', 'WeJustJammin',
      'repositoryOwnerId', '305953066',
      'repositoryVisibility', 'public',
      'ref', 'refs/heads/main',
      'refProtected', true,
      'eventName', 'workflow_dispatch',
      'environment', 'staging',
      'runnerEnvironment', 'github-hosted',
      'workflowRef', 'WeJustJammin/wejammin/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main',
      'workflowSha', repeat('a', 40),
      'sha', repeat('a', 40),
      'githubRunId', '34796668543',
      'githubRunAttempt', 1,
      'jtiSha256', repeat('7', 64),
      'tokenIssuedAt', to_char((instant.at - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'tokenNotBefore', to_char((instant.at - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'tokenExpiresAt', to_char((instant.at + interval '3 minutes') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    )
  ) as request
  from candidate cross join instant
)
insert into ac265_registered_prepare_fixtures (fixture_name, request)
select 'valid', request from valid;

grant select on ac265_registered_prepare_fixtures to service_role;
set local role service_role;
insert into ac265_candidate_enrollment_results (result_name, result)
select 'prepared', platform_api.ac265_prepare_hosted_run(request)
from ac265_registered_prepare_fixtures
where fixture_name = 'valid';
reset role;

select ok(
  (select result ->> 'state' = 'authorized'
       and result ->> 'identitySha256' = 'e231f64b2e8d80d8be53d5ac180aa3aa782f17391cf1b7f5a8e1befcf28e6b50'
      and result ->> 'sourceRevision' = repeat('a', 40)
      and result ->> 'deploymentId' = '6428523608'
      and result ->> 'runId' = '10000000-0000-4000-8000-000000000020'
   from pg_temp.ac265_candidate_enrollment_results
   where result_name = 'prepared'),
  'a valid OIDC prepare request resolves its server-enrolled candidate metadata'
);

select is(
  platform_api.ac265_prepare_hosted_run(
    jsonb_set(
      (select request from pg_temp.ac265_registered_prepare_fixtures where fixture_name = 'valid'),
      '{candidateRef}',
      to_jsonb('ac265-candidate://staging/10000000-0000-4000-8000-000000000099'::text)
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'valid OIDC claims cannot prepare an unregistered candidate reference'
);

select throws_ok(
  $$select platform_api.ac265_prepare_hosted_run((select request || jsonb_build_object('identity', jsonb_build_object('environment', 'production')) from pg_temp.ac265_registered_prepare_fixtures where fixture_name = 'valid'))$$,
  '22023', 'AC265 prepare-run request rejected',
  'the prepare RPC rejects caller-supplied candidate metadata'
);

select ok(
  (select count(*) = 1 from platform_private.ac265_verified_candidates),
  'prepare can consume a candidate but cannot enroll, update, or revoke it'
);

select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'extra-top-level'))$$, '22023', 'AC265 candidate enrollment request rejected', 'extra enrollment keys are rejected');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'caller-candidate-ref'))$$, '22023', 'AC265 candidate enrollment request rejected', 'candidate reference cannot be supplied by the caller');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'missing-identity-digest'))$$, '22023', 'AC265 candidate enrollment request rejected', 'identity digest is required');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'extra-identity-key'))$$, '22023', 'AC265 candidate enrollment request rejected', 'identity object rejects extra keys');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'extra-provenance-key'))$$, '22023', 'AC265 candidate enrollment request rejected', 'provenance object rejects extra keys');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'bad-identity-digest'))$$, '22023', 'AC265 candidate enrollment request rejected', 'identity digest must use lowercase SHA-256 hex format');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'untrusted-api-origin'))$$, '22023', 'AC265 candidate enrollment request rejected', 'enrollment pins the staging API origin');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'ci-source-artifact-mismatch'))$$, '22023', 'AC265 candidate enrollment request rejected', 'CI artifact digest must match candidate identity');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'staging-deployment-mismatch'))$$, '22023', 'AC265 candidate enrollment request rejected', 'staging deployment provenance must match candidate identity');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'migration-project-mismatch'))$$, '22023', 'AC265 candidate enrollment request rejected', 'migration project provenance must match candidate identity');
select throws_ok($$select platform_api.ac265_enroll_verified_candidate((select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'provider-missing-worker'))$$, '22023', 'AC265 candidate enrollment request rejected', 'provider evidence must include both staging Workers');

select is(
  platform_api.ac265_enroll_verified_candidate(
    jsonb_set(
      (select request from pg_temp.ac265_candidate_enrollment_fixtures where fixture_name = 'valid'),
      '{provenance,provider,evidenceSha256}',
      to_jsonb(repeat('0', 64))
    )
  ),
  '{"status":"conflict"}'::jsonb,
  'same digest with changed provenance collides and returns only the conflict sentinel'
);

select ok(
  (select count(*) = 1
   from platform_private.ac265_verified_candidates),
  'a conflicting enrollment cannot mutate the previously registered candidate'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'platform_private'
      and table_name = 'ac265_verified_candidates'
      and column_name in ('jti', 'jti_sha256', 'jwt', 'oidc_token', 'token', 'request', 'payload')
  ),
  'registry contains no raw OIDC token, JTI, request, or payload column'
);

select throws_ok(
  $$update platform_private.ac265_verified_candidates set deployment_id = 'mutation'$$,
  '55000', 'AC265 verified candidates are immutable',
  'even the table owner cannot mutate enrolled candidate metadata'
);
select throws_ok(
  $$truncate platform_private.ac265_verified_candidates$$,
  '55000', 'AC265 verified candidates are immutable',
  'the registry rejects truncation and revocation'
);

select finish();
rollback;
