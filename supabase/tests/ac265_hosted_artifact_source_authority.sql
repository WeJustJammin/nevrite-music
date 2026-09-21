begin;

create extension if not exists pgtap with schema extensions;
select no_plan();

select ok(
  to_regclass('platform_private.ac265_hosted_artifact_manifests') is not null,
  'CP04d creates the private hosted-artifact manifest authority ledger'
);
select ok(
  to_regclass('platform_private.ac265_hosted_artifact_manifest_sources') is not null,
  'CP04d creates the normalized hosted-artifact source ledger'
);
select ok(
  to_regclass('platform_private.ac265_hosted_artifact_replay_ledger') is not null,
  'CP04d creates the global artifact-reference replay ledger'
);
select ok(
  to_regclass('platform_private.ac265_hosted_artifact_manifest_finalizations') is not null,
  'CP04d creates the immutable signed-manifest finalization ledger'
);
select ok(
  to_regprocedure('platform_api.ac265_hosted_artifact_manifest_register(jsonb)')
    is not null,
  'CP04d exposes one strict service-role-only manifest registration RPC'
);
select ok(
  to_regprocedure('platform_api.ac265_hosted_artifact_manifest_finalize(jsonb)')
    is not null,
  'CP04d exposes one strict service-role-only manifest finalization RPC'
);
select ok(
  to_regprocedure('platform_api.ac265_hosted_artifact_manifest_read(jsonb)')
    is not null,
  'CP04d exposes one strict service-role-only manifest read RPC'
);

select ok(
  coalesce(
    (
      select bool_and(relrowsecurity and relforcerowsecurity)
      from pg_catalog.pg_class
      where oid in (
        to_regclass('platform_private.ac265_hosted_artifact_manifests'),
        to_regclass('platform_private.ac265_hosted_artifact_manifest_finalizations'),
        to_regclass('platform_private.ac265_hosted_artifact_manifest_sources'),
        to_regclass('platform_private.ac265_hosted_artifact_replay_ledger')
      )
    ),
    false
  ),
  'all CP04d ledgers enforce forced RLS'
);

select ok(
  coalesce(
    (
      select bool_and(
        not coalesce(
          has_table_privilege(role_name, table_name, privilege_name),
          false
        )
      )
      from (
        values
          ('public'::name),
          ('anon'::name),
          ('authenticated'::name),
          ('service_role'::name)
      ) as roles(role_name)
      cross join (
        values
          ('platform_private.ac265_hosted_artifact_manifests'::text),
          ('platform_private.ac265_hosted_artifact_manifest_finalizations'::text),
          ('platform_private.ac265_hosted_artifact_manifest_sources'::text),
          ('platform_private.ac265_hosted_artifact_replay_ledger'::text)
      ) as tables(table_name)
      cross join (
        values
          ('SELECT'::text), ('INSERT'::text), ('UPDATE'::text),
          ('DELETE'::text), ('TRUNCATE'::text), ('REFERENCES'::text),
          ('TRIGGER'::text)
      ) as privileges(privilege_name)
    ),
    false
  ),
  'no application role has direct CP04d ledger privileges'
);

select ok(
  coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_register(jsonb)'),
      'execute'
    ),
    false
  )
  and coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_finalize(jsonb)'),
      'execute'
    ),
    false
  )
  and coalesce(
    has_function_privilege(
      'service_role',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_read(jsonb)'),
      'execute'
    ),
    false
  )
  and not coalesce(
    has_function_privilege(
      'public',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_finalize(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_finalize(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_finalize(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'public',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_register(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_register(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_register(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'public',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_read(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'anon',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_read(jsonb)'),
      'execute'
    ),
    true
  )
  and not coalesce(
    has_function_privilege(
      'authenticated',
      to_regprocedure('platform_api.ac265_hosted_artifact_manifest_read(jsonb)'),
      'execute'
    ),
    true
  ),
  'only service_role can execute CP04d registration, finalization, and read RPCs'
);

select ok(
  coalesce(
    (
      select bool_and(p.prosecdef and p.proconfig = array['search_path=""']::text[])
      from pg_catalog.pg_proc as p
      where p.oid in (
        to_regprocedure('platform_api.ac265_hosted_artifact_manifest_register(jsonb)'),
        to_regprocedure('platform_api.ac265_hosted_artifact_manifest_finalize(jsonb)'),
        to_regprocedure('platform_api.ac265_hosted_artifact_manifest_read(jsonb)')
      )
    ),
    false
  ),
  'CP04d RPCs are SECURITY DEFINER with an empty search_path'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc as p
    join pg_catalog.pg_namespace as n on n.oid = p.pronamespace
    where n.nspname in ('platform_private', 'platform_api')
      and p.proname like 'ac265_%hosted_artifact%'
      and p.prosecdef
      and p.proconfig is distinct from array['search_path=""']::text[]
  ),
  'all CP04d SECURITY DEFINER helpers use an empty search_path'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'platform_private'
      and table_name in (
        'ac265_hosted_artifact_manifests',
        'ac265_hosted_artifact_manifest_finalizations',
        'ac265_hosted_artifact_manifest_sources',
        'ac265_hosted_artifact_replay_ledger'
      )
      and column_name ~ '(bytes|private_key|public_key|locator)'
      and column_name not in ('artifact_sha256', 'attestation_sha256')
  ),
  'CP04d ledgers retain no raw bytes, keys, or locators'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'platform_private'
      and table_name = 'ac265_hosted_artifact_manifests'
      and column_name = 'acceptance_capable'
  ),
  'CP04d does not persist an acceptance-capable claim'
);

select is(
  (select count(*) from platform_private.ac265_hosted_artifact_manifests),
  0::bigint,
  'the migration seeds no artifact manifest'
);
select is(
  (select count(*) from platform_private.ac265_hosted_artifact_manifest_finalizations),
  0::bigint,
  'the migration seeds no signed-manifest finalization'
);
select is(
  (select count(*) from platform_private.ac265_hosted_artifact_manifest_sources),
  0::bigint,
  'the migration seeds no artifact source'
);
select is(
  (select count(*) from platform_private.ac265_hosted_artifact_replay_ledger),
  0::bigint,
  'the migration seeds no artifact replay row'
);

insert into platform_private.ac265_verified_candidates (
  candidate_id, identity_sha256, source_revision, deployment_id,
  ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt,
  ci_artifact_id, staging_artifact_id, identity, provenance
) values (
  'a2650001-0000-4000-8000-000000000001'::uuid,
  decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523608',
  '96000001', 1, '96000002', 1, 9601, 9602,
  jsonb_build_object(
    'environment', 'staging', 'ciRunId', '96000001',
    'ciRunAttempt', 1, 'stagingRunId', '96000002',
    'stagingRunAttempt', 1, 'sourceRevision', repeat('a', 40),
    'deploymentId', '6428523608', 'hostingProjectId', 'wejammin-staging',
    'supabaseProjectRef', 'abcdefghijklmnopqrst'
  ),
  '{}'::jsonb
);

insert into platform_private.ac265_runner_authorizations (
  authorization_id, run_id, identity_sha256, source_revision, deployment_id,
  github_run_id, github_run_attempt, workflow_sha, jti_sha256,
  request_sha256, authorized_at, expires_at
) values
  (
    'a2650002-0000-4000-8000-000000000001'::uuid,
    'a2650003-0000-4000-8000-000000000001'::uuid,
    decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523608',
    '96100001', 1, repeat('a', 40), decode(repeat('1', 64), 'hex'),
    decode(repeat('2', 64), 'hex'), clock_timestamp() - interval '30 seconds',
    clock_timestamp() + interval '4 minutes'
  ),
  (
    'a2650002-0000-4000-8000-000000000002'::uuid,
    'a2650003-0000-4000-8000-000000000002'::uuid,
    decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523608',
    '96100002', 1, repeat('a', 40), decode(repeat('3', 64), 'hex'),
    decode(repeat('4', 64), 'hex'), clock_timestamp() - interval '30 seconds',
    clock_timestamp() + interval '4 minutes'
  ),
  (
    'a2650002-0000-4000-8000-000000000003'::uuid,
    'a2650003-0000-4000-8000-000000000003'::uuid,
    decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523608',
    '96100003', 1, repeat('a', 40), decode(repeat('5', 64), 'hex'),
    decode(repeat('6', 64), 'hex'), clock_timestamp() - interval '30 seconds',
    clock_timestamp() + interval '4 minutes'
  ),
  (
    'a2650002-0000-4000-8000-000000000004'::uuid,
    'a2650003-0000-4000-8000-000000000004'::uuid,
    decode(repeat('b', 64), 'hex'), repeat('a', 40), '6428523608',
    '96100004', 1, repeat('a', 40), decode(repeat('7', 64), 'hex'),
    decode(repeat('8', 64), 'hex'), clock_timestamp() - interval '30 seconds',
    clock_timestamp() + interval '4 minutes'
  );

create temporary table ac265_cp04d_requests (
  request_name text primary key,
  request jsonb not null,
  result jsonb,
  finalization_result jsonb
) on commit drop;
grant select, insert, update on ac265_cp04d_requests to service_role;

insert into ac265_cp04d_requests (request_name, request)
values
  (
    'full',
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef',
        'ac265-authorization://staging/a2650002-0000-4000-8000-000000000001',
      'idempotencyRef',
        'ac265-idempotency://staging/a2650004-0000-4000-8000-000000000001',
      'sources', jsonb_build_array(
        jsonb_build_object(
          'kind', 'execution_evidence',
          'artifactRef', 'ac265-evidence://blob/a2650005-0000-4000-8000-000000000002',
          'artifactSha256', repeat('f', 64),
          'attestationSha256', repeat('0', 64),
          'attestationKeyId', 'release-key-2026-09',
          'subjectSha256', repeat('1', 64),
          'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ),
        jsonb_build_object(
          'kind', 'server_receipt',
          'artifactRef', 'ac265-receipt://server/a2650005-0000-4000-8000-000000000001',
          'artifactSha256', repeat('c', 64),
          'attestationSha256', repeat('d', 64),
          'attestationKeyId', 'release-key-2026-09',
          'subjectSha256', repeat('e', 64),
          'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        )
      )
    )
  ),
  (
    'single',
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef',
        'ac265-authorization://staging/a2650002-0000-4000-8000-000000000002',
      'idempotencyRef',
        'ac265-idempotency://staging/a2650004-0000-4000-8000-000000000002',
      'sources', jsonb_build_array(
        jsonb_build_object(
          'kind', 'execution_evidence',
          'artifactRef', 'ac265-evidence://blob/a2650005-0000-4000-8000-000000000003',
          'artifactSha256', repeat('2', 64),
          'attestationSha256', repeat('3', 64),
          'attestationKeyId', 'release-key-2026-09',
          'subjectSha256', repeat('4', 64),
          'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        )
      )
    )
  ),
  (
    'global-replay',
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef',
        'ac265-authorization://staging/a2650002-0000-4000-8000-000000000003',
      'idempotencyRef',
        'ac265-idempotency://staging/a2650004-0000-4000-8000-000000000003',
      'sources', jsonb_build_array(
        jsonb_build_object(
          'kind', 'server_receipt',
          'artifactRef', 'ac265-receipt://server/a2650005-0000-4000-8000-000000000001',
          'artifactSha256', repeat('c', 64),
          'attestationSha256', repeat('d', 64),
          'attestationKeyId', 'release-key-2026-09',
          'subjectSha256', repeat('e', 64),
          'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        ),
        jsonb_build_object(
          'kind', 'execution_evidence',
          'artifactRef', 'ac265-evidence://blob/a2650005-0000-4000-8000-000000000004',
          'artifactSha256', repeat('5', 64),
          'attestationSha256', repeat('6', 64),
          'attestationKeyId', 'release-key-2026-09',
          'subjectSha256', repeat('7', 64),
          'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
          'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
        )
      )
    )
  );

insert into ac265_cp04d_requests (request_name, request)
select
  'max',
  jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
    'authorizationRef',
      'ac265-authorization://staging/a2650002-0000-4000-8000-000000000004',
    'idempotencyRef',
      'ac265-idempotency://staging/a2650004-0000-4000-8000-000000000004',
    'sources', jsonb_agg(
      jsonb_build_object(
        'kind', case when series.number = 1
          then 'server_receipt' else 'execution_evidence' end,
        'artifactRef', case when series.number = 1
          then 'ac265-receipt://server/' || extensions.gen_random_uuid()::text
          else 'ac265-evidence://blob/' || extensions.gen_random_uuid()::text end,
        'artifactSha256', lpad(to_hex(series.number), 64, '0'),
        'attestationSha256', lpad(to_hex(series.number + 256), 64, '0'),
        'attestationKeyId', 'release-key-2026-09',
        'subjectSha256', lpad(to_hex(series.number + 512), 64, '0'),
        'issuedAt', to_char((clock_timestamp() - interval '30 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
        'expiresAt', to_char((clock_timestamp() + interval '90 seconds') at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
      )
      order by series.number
    )
  )
from generate_series(1, 256) as series(number);

set local role service_role;
update ac265_cp04d_requests
set result = platform_api.ac265_hosted_artifact_manifest_register(request);
update ac265_cp04d_requests
set finalization_result = platform_api.ac265_hosted_artifact_manifest_finalize(
  jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
    'authorizationRef', request ->> 'authorizationRef',
    'manifestId', result ->> 'manifestId',
    'finalizationRef', 'ac265-finalization://staging/a2650007-0000-4000-8000-000000000001',
    'manifestSha256', repeat('9', 64)
  )
)
where request_name = 'full';
reset role;

select ok(
  (select result ->> 'manifestRef' from ac265_cp04d_requests where request_name = 'full')
    ~ '^ac265-artifact-manifest://staging/[0-9a-f-]{36}$',
  'registration returns a server-generated manifest reference'
);
select is(
  (select result ->> 'sourceCount' from ac265_cp04d_requests where request_name = 'full'),
  '2',
  'the full manifest reports its two registered sources'
);
select is(
  (select result ->> 'sourceSetComplete' from ac265_cp04d_requests where request_name = 'full'),
  'true',
  'the full source set is complete bookkeeping'
);
select is(
  (select result ->> 'kindComplete' from ac265_cp04d_requests where request_name = 'full'),
  'true',
  'the full source set covers both source kinds without claiming acceptance or signatures'
);
select ok(
  (select result ? 'acceptanceCapable' = false
    and result ? 'signatureVerified' = false
   from ac265_cp04d_requests where request_name = 'full'),
  'the envelope makes no AC265 acceptance or signature-proof claim'
);
select ok(
  (select (result -> 'sources' -> 0 ->> 'artifactRef') <
          (result -> 'sources' -> 1 ->> 'artifactRef')
   from ac265_cp04d_requests where request_name = 'full'),
  'the envelope orders source references by code point'
);
select is(
  (select result ->> 'runId' from ac265_cp04d_requests where request_name = 'full'),
  'a2650003-0000-4000-8000-000000000001',
  'run binding is derived from the authorization'
);
select is(
  (select result ->> 'candidateId' from ac265_cp04d_requests where request_name = 'full'),
  'a2650001-0000-4000-8000-000000000001',
  'candidate binding is derived from the enrolled candidate'
);
select is(
  (select result ->> 'sourceRevision' from ac265_cp04d_requests where request_name = 'full'),
  repeat('a', 40),
  'source revision binding is derived from the authorization and candidate'
);
select is(
  (select result ->> 'hostingProjectId' from ac265_cp04d_requests where request_name = 'full'),
  'wejammin-staging',
  'hosting project binding is derived from candidate identity'
);
select is(
  (select result ->> 'supabaseProjectRef' from ac265_cp04d_requests where request_name = 'full'),
  'abcdefghijklmnopqrst',
  'Supabase project binding is derived from candidate identity'
);
select is(
  jsonb_array_length((select result -> 'sources' from ac265_cp04d_requests where request_name = 'full')),
  2,
  'the registration envelope includes both normalized sources'
);
select ok(
  (select (result ? 'artifactBytes') = false and (result ? 'attestationBytes') = false
    and (result ? 'privateKey') = false and (result ? 'locator') = false
   from ac265_cp04d_requests where request_name = 'full'),
  'registration envelope is digest/reference-only'
);

select is(
  (select finalization_result ->> 'manifestSha256'
   from ac265_cp04d_requests where request_name = 'full'),
  repeat('9', 64),
  'finalization stores and returns the immutable final signed-manifest digest'
);
select is(
  (select finalization_result ->> 'lifecycle'
   from ac265_cp04d_requests where request_name = 'full'),
  'finalized',
  'finalization changes lifecycle bookkeeping to finalized'
);
select ok(
  (select jsonb_typeof(finalization_result -> 'authorization' -> 'authorizedAt') = 'string'
      and jsonb_typeof(finalization_result -> 'authorization' -> 'expiresAt') = 'string'
   from ac265_cp04d_requests where request_name = 'full'),
  'the envelope exposes the server-derived authorization window'
);
select ok(
  exists (
    select 1
    from platform_private.ac265_hosted_artifact_manifest_finalizations as finalization
    where encode(finalization.manifest_sha256, 'hex') = repeat('9', 64)
      and encode(finalization.request_sha256, 'hex') <> repeat('9', 64)
  ),
  'the final signed-manifest digest is distinct from the registration/finalization request digest'
);
select is(
  (select result ->> 'manifestSha256'
   from ac265_cp04d_requests where request_name = 'single'),
  null,
  'a registered but unsigned manifest has no final digest'
);
select is(
  (select result ->> 'lifecycle'
   from ac265_cp04d_requests where request_name = 'single'),
  'registered',
  'a registered but unsigned manifest reports registered lifecycle'
);

set local role service_role;
select is(
  platform_api.ac265_hosted_artifact_manifest_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef', (select request ->> 'authorizationRef' from ac265_cp04d_requests where request_name = 'single'),
      'manifestId', (select result ->> 'manifestId' from ac265_cp04d_requests where request_name = 'single')
    )
  ) ->> 'status',
  'conflict',
  'a registered-only manifest is rejected by the finalized-only read RPC'
);
select is(
  platform_api.ac265_hosted_artifact_manifest_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef', (select request ->> 'authorizationRef' from ac265_cp04d_requests where request_name = 'full'),
      'manifestId', (select result ->> 'manifestId' from ac265_cp04d_requests where request_name = 'full')
    )
  ) ->> 'manifestSha256',
  repeat('9', 64),
  'finalized read returns a non-null immutable manifest digest'
);
select ok(
  (
    select (read_result ->> 'finalizationRef') is not null
      and (read_result ->> 'finalizedAt') is not null
    from (
      select platform_api.ac265_hosted_artifact_manifest_read(
        jsonb_build_object(
          'criterion', 'P2-S09-AC-265',
          'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
          'authorizationRef', request ->> 'authorizationRef',
          'manifestId', result ->> 'manifestId'
        )
      ) as read_result
      from ac265_cp04d_requests
      where request_name = 'full'
    ) as finalized_read
  ),
  'finalized read exposes non-null finalization reference and timestamp'
);
reset role;

select is(
  (
    select platform_api.ac265_hosted_artifact_manifest_finalize(
      jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
        'authorizationRef', request ->> 'authorizationRef',
        'manifestId', result ->> 'manifestId',
        'finalizationRef', 'ac265-finalization://staging/a2650007-0000-4000-8000-000000000001',
        'manifestSha256', repeat('9', 64)
      )
    )
    from ac265_cp04d_requests where request_name = 'full'
  ),
  (select finalization_result from ac265_cp04d_requests where request_name = 'full'),
  'an exact finalization replay returns the immutable finalized envelope'
);

select is(
  (
    select platform_api.ac265_hosted_artifact_manifest_finalize(
      jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
        'authorizationRef', request ->> 'authorizationRef',
        'manifestId', result ->> 'manifestId',
        'finalizationRef', 'ac265-finalization://staging/a2650007-0000-4000-8000-000000000001',
        'manifestSha256', repeat('8', 64)
      )
    ) ->> 'status'
    from ac265_cp04d_requests where request_name = 'full'
  ),
  'conflict',
  'a finalization reference cannot be reused for a different digest'
);

select is(
  (
    select platform_api.ac265_hosted_artifact_manifest_finalize(
      jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
        'authorizationRef', request ->> 'authorizationRef',
        'manifestId', result ->> 'manifestId',
        'finalizationRef', 'ac265-finalization://staging/a2650007-0000-4000-8000-000000000002',
        'manifestSha256', repeat('9', 64)
      )
    ) ->> 'status'
    from ac265_cp04d_requests where request_name = 'single'
  ),
  'conflict',
  'a final signed-manifest digest cannot be replayed across manifests'
);

select is(
  platform_api.ac265_hosted_artifact_manifest_finalize(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef', 'ac265-authorization://staging/a2650002-0000-4000-8000-000000000002',
      'manifestId', (select result ->> 'manifestId'
                    from ac265_cp04d_requests where request_name = 'full'),
      'finalizationRef', 'ac265-finalization://staging/a2650007-0000-4000-8000-000000000003',
      'manifestSha256', repeat('7', 64)
    )
  ) ->> 'status',
  'conflict',
  'finalization rejects a manifest addressed through the wrong authorization'
);

select is(
  (select finalization_result from ac265_cp04d_requests where request_name = 'full'),
  (select platform_api.ac265_hosted_artifact_manifest_register(request)
   from ac265_cp04d_requests where request_name = 'full'),
  'an exact replay returns the immutable finalized envelope'
);

select is(
  platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_set(
      (select request from ac265_cp04d_requests where request_name = 'full'),
      '{sources}',
      jsonb_build_array(
        (select (request -> 'sources') -> 1 from ac265_cp04d_requests where request_name = 'full'),
        (select (request -> 'sources') -> 0 from ac265_cp04d_requests where request_name = 'full')
      )
    )
  ),
  (select finalization_result from ac265_cp04d_requests where request_name = 'full'),
  'reversed source input canonicalizes to the same idempotent registration'
);

select is(
  (select result ->> 'sourceSetComplete' from ac265_cp04d_requests where request_name = 'single'),
  'true',
  'an evidence-only source set is complete bookkeeping'
);
select is(
  (select result ->> 'kindComplete' from ac265_cp04d_requests where request_name = 'single'),
  'false',
  'an evidence-only source set does not claim both-kind coverage'
);
select is(
  (select result ->> 'sourceCount' from ac265_cp04d_requests where request_name = 'single'),
  '1',
  'a one-source manifest reports one source'
);
select is(
  (select result -> 'sources' -> 0 ->> 'kind' from ac265_cp04d_requests where request_name = 'single'),
  'execution_evidence',
  'the single-source coverage case is evidence-only'
);

select is(
  (select result ->> 'sourceCount' from ac265_cp04d_requests where request_name = 'max'),
  '256',
  'the source set accepts the maximum 256 entries'
);
select is(
  (select result ->> 'kindComplete' from ac265_cp04d_requests where request_name = 'max'),
  'true',
  'the maximum source set reports both-kind coverage only'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef', 'ac265-authorization://staging/a2650002-0000-4000-8000-000000000001',
      'idempotencyRef', 'ac265-idempotency://staging/a2650004-0000-4000-8000-000000000004',
      'sources', '[]'::jsonb
    )
  )$$,
  '22023',
  null,
  'an empty source set is rejected'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef', 'ac265-authorization://staging/a2650002-0000-4000-8000-000000000001',
      'idempotencyRef', 'ac265-idempotency://staging/a2650004-0000-4000-8000-000000000005',
      'sources', (
        select jsonb_agg(
          jsonb_build_object(
            'kind', 'server_receipt',
            'artifactRef', 'ac265-receipt://server/' || extensions.gen_random_uuid()::text,
            'artifactSha256', repeat('a', 64),
            'attestationSha256', repeat('b', 64),
            'attestationKeyId', 'release-key-2026-09',
            'subjectSha256', repeat('c', 64),
            'issuedAt', '2026-09-21T00:00:00Z',
            'expiresAt', '2026-09-21T00:01:00Z'
          )
        )
        from generate_series(1, 257)
      )
    )
  )$$,
  '22023',
  null,
  'a source set above the 256-entry bound is rejected'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    (select request || jsonb_build_object('extraBinding', 'caller-controlled')
     from ac265_cp04d_requests where request_name = 'full')
  )$$,
  '22023',
  null,
  'caller-controlled binding fields are rejected by the strict request shape'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    (
      select request || jsonb_build_object(
        'sources', (request -> 'sources') || jsonb_build_array((request -> 'sources') -> 0)
      )
      from ac265_cp04d_requests
      where request_name = 'full'
    )
  )$$,
  '22023',
  null,
  'duplicate artifact references inside one source set are rejected'
);

select is(
  platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_set(
      (select request from ac265_cp04d_requests where request_name = 'full'),
      '{sources,0,artifactSha256}',
      to_jsonb(repeat('8', 64))
    )
  ) ->> 'status',
  'conflict',
  'reusing an idempotency reference with a different request is a conflict'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          (select request from ac265_cp04d_requests where request_name = 'full'),
          '{idempotencyRef}',
          to_jsonb('ac265-idempotency://staging/a2650004-0000-4000-8000-000000000005'::text)
        ),
        '{sources,0,issuedAt}',
        to_jsonb('2026-09-20T00:00:00Z'::text)
      ),
      '{sources,0,expiresAt}',
      to_jsonb('2026-09-20T00:01:00Z'::text)
    )
  )$$,
  '22023',
  null,
  'an expired source window is rejected before idempotent fallback'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          (select request from ac265_cp04d_requests where request_name = 'full'),
          '{idempotencyRef}',
          to_jsonb('ac265-idempotency://staging/a2650004-0000-4000-8000-000000000006'::text)
        ),
        '{sources,0,issuedAt}',
        to_jsonb('2099-01-01T00:00:00Z'::text)
      ),
      '{sources,0,expiresAt}',
      to_jsonb('2099-01-01T00:01:00Z'::text)
    )
  )$$,
  '22023',
  null,
  'a future source window is rejected before idempotent fallback'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_set(
      jsonb_set(
        (select request from ac265_cp04d_requests where request_name = 'full'),
        '{idempotencyRef}',
        to_jsonb('ac265-idempotency://staging/a2650004-0000-4000-8000-000000000007'::text)
      ),
      '{sources,0,attestationKeyId}',
      to_jsonb('Release-key'::text)
    )
  )$$,
  '22023',
  null,
  'uppercase attestation key IDs are rejected'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_set(
      jsonb_set(
        (select request from ac265_cp04d_requests where request_name = 'full'),
        '{idempotencyRef}',
        to_jsonb('ac265-idempotency://staging/a2650004-0000-4000-8000-000000000008'::text)
      ),
      '{sources,0,attestationKeyId}',
      to_jsonb('a'::text)
    )
  )$$,
  '22023',
  null,
  'one-character attestation key IDs are rejected'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_set(
      jsonb_set(
        (select request from ac265_cp04d_requests where request_name = 'full'),
        '{idempotencyRef}',
        to_jsonb('ac265-idempotency://staging/a2650004-0000-4000-8000-000000000009'::text)
      ),
      '{sources,0,attestationKeyId}',
      to_jsonb('release:key'::text)
    )
  )$$,
  '22023',
  null,
  'colon-containing attestation key IDs are rejected'
);

select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register(
    jsonb_set(
      jsonb_set(
        (select request from ac265_cp04d_requests where request_name = 'full'),
        '{idempotencyRef}',
        to_jsonb('ac265-idempotency://staging/a2650004-0000-4000-8000-000000000010'::text)
      ),
      '{sources,0,attestationKeyId}',
      to_jsonb(('a' || repeat('b', 96))::text)
    )
  )$$,
  '22023',
  null,
  'attestation key IDs longer than 96 characters are rejected'
);

select is(
  platform_api.ac265_hosted_artifact_manifest_register(
    (select request from ac265_cp04d_requests where request_name = 'global-replay')
  ) ->> 'status',
  'conflict',
  'an artifact reference cannot be replayed in another manifest'
);

select is(
  (select count(*) from platform_private.ac265_hosted_artifact_manifests),
  3::bigint,
  'only the full, one-source, and maximum-size manifests were registered'
);
select is(
  (select count(*) from platform_private.ac265_hosted_artifact_manifest_sources),
  259::bigint,
  'source rows are normalized exactly once'
);
select is(
  (select count(*) from platform_private.ac265_hosted_artifact_replay_ledger),
  259::bigint,
  'the global replay ledger contains every accepted artifact reference once'
);
select is(
  (select count(*) from platform_private.ac265_hosted_artifact_manifest_finalizations),
  1::bigint,
  'the finalization ledger contains one immutable final digest'
);

select is(
  (
    select platform_api.ac265_hosted_artifact_manifest_read(
      jsonb_build_object(
        'criterion', 'P2-S09-AC-265',
        'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
        'authorizationRef', request ->> 'authorizationRef',
        'manifestId', result ->> 'manifestId'
      )
    )
    from ac265_cp04d_requests
    where request_name = 'full'
  ),
  (select finalization_result from ac265_cp04d_requests where request_name = 'full'),
  'the read RPC returns the same redacted immutable manifest envelope'
);

select is(
  platform_api.ac265_hosted_artifact_manifest_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef', 'ac265-authorization://staging/a2650002-0000-4000-8000-000000000002',
      'manifestId', (select result ->> 'manifestId'
                    from ac265_cp04d_requests where request_name = 'full')
    )
  ) ->> 'status',
  'conflict',
  'a manifest cannot be read through another authorization (IDOR denial)'
);

select is(
  platform_api.ac265_hosted_artifact_manifest_read(
    jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
      'authorizationRef', 'ac265-authorization://staging/a2650002-0000-4000-8000-000000000001',
      'manifestId', 'a2650006-0000-4000-8000-000000000099'
    )
  ) ->> 'status',
  'conflict',
  'a read for a non-matching manifest is a conflict'
);

set local role anon;
select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_register('{}'::jsonb)$$,
  '42501',
  null,
  'anonymous callers cannot register a hosted-artifact manifest'
);
select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_read('{}'::jsonb)$$,
  '42501',
  null,
  'anonymous callers cannot read a hosted-artifact manifest'
);
select throws_ok(
  $$select platform_api.ac265_hosted_artifact_manifest_finalize('{}'::jsonb)$$,
  '42501',
  null,
  'anonymous callers cannot finalize a hosted-artifact manifest'
);
reset role;

select throws_ok(
  $$update platform_private.ac265_hosted_artifact_manifests
    set source_count = source_count
    where manifest_ref = (select result ->> 'manifestRef'
                          from ac265_cp04d_requests
                          where request_name = 'full')$$,
  '55000',
  null,
  'manifest rows are immutable'
);
select throws_ok(
  $$update platform_private.ac265_hosted_artifact_manifest_sources
    set attestation_key_id = attestation_key_id
    where artifact_ref = 'ac265-receipt://server/a2650005-0000-4000-8000-000000000001'$$,
  '55000',
  null,
  'manifest source rows are immutable'
);
select throws_ok(
  $$delete from platform_private.ac265_hosted_artifact_replay_ledger
    where artifact_ref = 'ac265-receipt://server/a2650005-0000-4000-8000-000000000001'$$,
  '55000',
  null,
  'global replay rows are immutable'
);
select throws_ok(
  $$update platform_private.ac265_hosted_artifact_manifest_finalizations
    set manifest_sha256 = manifest_sha256
    where manifest_id = (select result ->> 'manifestId'
                         from ac265_cp04d_requests
                         where request_name = 'full')::uuid$$,
  '55000',
  null,
  'finalization rows are immutable'
);

select * from finish();
rollback;
