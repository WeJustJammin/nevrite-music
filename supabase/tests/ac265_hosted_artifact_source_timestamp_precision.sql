begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'platform_private.ac265_hosted_artifact_replay_ledger'::regclass
      and conname = 'ac265_hosted_artifact_replay_millisecond_precision'
      and pg_get_constraintdef(oid) like '%date_trunc%'
      and pg_get_constraintdef(oid) like '%issued_at%'
      and pg_get_constraintdef(oid) like '%expires_at%'
  ),
  'the replay ledger enforces millisecond precision for source windows'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'platform_private.ac265_hosted_artifact_manifest_sources'::regclass
      and conname = 'ac265_hosted_artifact_sources_millisecond_precision'
      and pg_get_constraintdef(oid) like '%date_trunc%'
      and pg_get_constraintdef(oid) like '%issued_at%'
      and pg_get_constraintdef(oid) like '%expires_at%'
  ),
  'the normalized source ledger enforces millisecond precision for source windows'
);

insert into platform_private.ac265_verified_candidates (
  candidate_id, identity_sha256, source_revision, deployment_id,
  ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
  ci_artifact_id, staging_artifact_id, identity, provenance
) values (
  'a2650201-0000-4000-8000-000000000001'::uuid,
  decode(repeat('a', 64), 'hex'), repeat('b', 40), 'timestamp-parity',
  '98000001', 1, '98000002', 1, 9801, 9802,
  jsonb_build_object(
    'environment', 'staging', 'ciRunId', '98000001',
    'ciRunAttempt', 1, 'stagingRunId', '98000002',
    'stagingRunAttempt', 1, 'sourceRevision', repeat('b', 40),
    'deploymentId', 'timestamp-parity', 'hostingProjectId', 'wejammin-staging',
    'supabaseProjectRef', 'abcdefghijklmnopqrst'
  ),
  '{}'::jsonb
);

insert into platform_private.ac265_runner_authorizations (
  authorization_id, run_id, identity_sha256, source_revision, deployment_id,
  github_run_id, github_run_attempt, workflow_sha, jti_sha256,
  request_sha256, authorized_at, expires_at
) values (
  'a2650202-0000-4000-8000-000000000001'::uuid,
  'a2650203-0000-4000-8000-000000000001'::uuid,
  decode(repeat('a', 64), 'hex'), repeat('b', 40), 'timestamp-parity',
  '98100001', 1, repeat('b', 40), decode(repeat('c', 64), 'hex'),
  decode(repeat('d', 64), 'hex'),
  date_trunc('milliseconds', clock_timestamp() - interval '30 seconds'),
  date_trunc('milliseconds', clock_timestamp() + interval '4 minutes')
);

set local role service_role;
select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef', 'ac265-authorization://staging/a2650202-0000-4000-8000-000000000001',
      'idempotencyRef', 'ac265-idempotency://staging/a2650204-0000-4000-8000-000000000001',
      'sources', jsonb_build_array(
        jsonb_build_object(
          'kind', 'server_receipt',
          'artifactRef', 'ac265-receipt://server/a2650205-0000-4000-8000-000000000001',
          'artifactSha256', repeat('e', 64),
          'attestationSha256', repeat('f', 64),
          'attestationKeyId', 'release-key-timestamp',
          'subjectSha256', repeat('0', 64),
          'issuedAt', to_char(
            date_trunc('milliseconds', clock_timestamp() - interval '30 seconds')
              + interval '1 microsecond',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          ),
          'expiresAt', to_char(
            date_trunc('milliseconds', clock_timestamp() + interval '90 seconds')
              + interval '1 microsecond',
            'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'
          )
        )
      )
    )
  )$$,
  '23514',
  null,
  'the direct register RPC rejects source timestamps finer than milliseconds'
);
reset role;

select * from finish();
rollback;
