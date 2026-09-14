create table platform_private.ac265_verified_candidates (
  candidate_id uuid primary key default extensions.gen_random_uuid(),
  identity_sha256 bytea not null,
  source_revision text not null,
  deployment_id text not null,
  ci_run_id text not null,
  ci_run_attempt integer not null,
  staging_run_id text not null,
  staging_run_attempt integer not null,
  ci_artifact_id bigint not null,
  staging_artifact_id bigint not null,
  identity jsonb not null,
  provenance jsonb not null,
  enrolled_at timestamptz not null default clock_timestamp(),
  constraint ac265_verified_candidates_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_verified_candidates_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_verified_candidates_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_verified_candidates_ci_run_id_format
    check (ci_run_id ~ '^[1-9][0-9]{0,19}$'),
  constraint ac265_verified_candidates_ci_run_attempt_range
    check (ci_run_attempt between 1 and 1000),
  constraint ac265_verified_candidates_staging_run_id_format
    check (staging_run_id ~ '^[1-9][0-9]{0,19}$'),
  constraint ac265_verified_candidates_staging_run_attempt_range
    check (staging_run_attempt between 1 and 1000),
  constraint ac265_verified_candidates_ci_artifact_id_positive
    check (ci_artifact_id > 0),
  constraint ac265_verified_candidates_staging_artifact_id_positive
    check (staging_artifact_id > 0),
  constraint ac265_verified_candidates_identity_shape
    check (jsonb_typeof(identity) = 'object'),
  constraint ac265_verified_candidates_provenance_shape
    check (jsonb_typeof(provenance) = 'object'),
  constraint ac265_verified_candidates_identity_tuple_matches
    check (
      identity ->> 'sourceRevision' = source_revision
      and identity ->> 'deploymentId' = deployment_id
      and identity ->> 'ciRunId' = ci_run_id
      and (identity ->> 'ciRunAttempt')::numeric = ci_run_attempt
      and identity ->> 'stagingRunId' = staging_run_id
      and (identity ->> 'stagingRunAttempt')::numeric = staging_run_attempt
    ),
  constraint ac265_verified_candidates_identity_digest_unique unique (identity_sha256),
  constraint ac265_verified_candidates_source_deployment_unique
    unique (source_revision, deployment_id),
  constraint ac265_verified_candidates_verified_runs_unique
    unique (ci_run_id, ci_run_attempt, staging_run_id, staging_run_attempt)
);

alter table platform_private.ac265_verified_candidates enable row level security;
alter table platform_private.ac265_verified_candidates force row level security;

revoke all on table platform_private.ac265_verified_candidates
  from public, anon, authenticated, service_role;

create function platform_private.ac265_reject_verified_candidate_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 verified candidates are immutable'
    using errcode = '55000';
end;
$function$;

revoke all on function platform_private.ac265_reject_verified_candidate_mutation()
  from public, anon, authenticated, service_role;

create trigger ac265_verified_candidates_are_immutable
  before update or delete or truncate
  on platform_private.ac265_verified_candidates
  for each statement
  execute function platform_private.ac265_reject_verified_candidate_mutation();

create table platform_private.ac265_runner_authorizations (
  authorization_id uuid primary key default extensions.gen_random_uuid(),
  run_id uuid not null,
  identity_sha256 bytea not null,
  source_revision text not null,
  deployment_id text not null,
  github_run_id text not null,
  github_run_attempt integer not null,
  workflow_sha text not null,
  jti_sha256 bytea not null,
  request_sha256 bytea not null,
  authorized_at timestamptz not null,
  expires_at timestamptz not null,
  constraint ac265_runner_authorizations_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_runner_authorizations_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_runner_authorizations_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_runner_authorizations_github_run_id_format
    check (github_run_id ~ '^[1-9][0-9]{0,19}$'),
  constraint ac265_runner_authorizations_github_run_attempt_range
    check (github_run_attempt between 1 and 1000),
  constraint ac265_runner_authorizations_workflow_sha_format
    check (workflow_sha ~ '^[a-f0-9]{40}$'),
  constraint ac265_runner_authorizations_revision_matches
    check (source_revision = workflow_sha),
  constraint ac265_runner_authorizations_jti_sha256_length
    check (octet_length(jti_sha256) = 32),
  constraint ac265_runner_authorizations_request_sha256_length
    check (octet_length(request_sha256) = 32),
  constraint ac265_runner_authorizations_expiry_window
    check (expires_at > authorized_at and expires_at <= authorized_at + interval '5 minutes'),
  constraint ac265_runner_authorizations_run_unique unique (run_id),
  constraint ac265_runner_authorizations_jti_unique unique (jti_sha256),
  constraint ac265_runner_authorizations_github_attempt_unique
    unique (github_run_id, github_run_attempt)
);

alter table platform_private.ac265_runner_authorizations enable row level security;
alter table platform_private.ac265_runner_authorizations force row level security;

revoke all on table platform_private.ac265_runner_authorizations
  from public, anon, authenticated, service_role;

create table platform_private.ac265_runner_authorization_jtis (
  jti_sha256 bytea primary key,
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id) on delete cascade,
  constraint ac265_runner_authorization_jtis_digest_length
    check (octet_length(jti_sha256) = 32)
);

create index ac265_runner_authorization_jtis_authorization_id_idx
  on platform_private.ac265_runner_authorization_jtis (authorization_id);

alter table platform_private.ac265_runner_authorization_jtis enable row level security;
alter table platform_private.ac265_runner_authorization_jtis force row level security;

revoke all on table platform_private.ac265_runner_authorization_jtis
  from public, anon, authenticated, service_role;

create function platform_api.ac265_enroll_verified_candidate(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'identitySha256', 'identity', 'provenance'
  ];
  v_identity_keys constant text[] := array[
    'environment', 'ciRunId', 'ciRunAttempt', 'stagingRunId', 'stagingRunAttempt',
    'sourceRevision', 'deploymentId', 'deployedAt', 'buildId', 'buildManifestSha256',
    'artifactSha256', 'hostingAccountId', 'hostingProjectId', 'supabaseProjectRef',
    'migrationVersion', 'migrationSha256', 'webOrigin', 'apiOrigin', 'supabaseOrigin'
  ];
  v_identity_string_keys constant text[] := array[
    'environment', 'ciRunId', 'stagingRunId', 'sourceRevision', 'deploymentId',
    'deployedAt', 'buildId', 'buildManifestSha256', 'artifactSha256',
    'hostingAccountId', 'hostingProjectId', 'supabaseProjectRef', 'migrationVersion',
    'migrationSha256', 'webOrigin', 'apiOrigin', 'supabaseOrigin'
  ];
  v_provenance_keys constant text[] := array[
    'repository', 'sourceRevision', 'ci', 'staging', 'artifact', 'migration', 'provider'
  ];
  v_ci_keys constant text[] := array[
    'runId', 'runAttempt', 'workflowPath', 'artifactName', 'artifactId', 'artifactDigest'
  ];
  v_ci_string_keys constant text[] := array[
    'runId', 'workflowPath', 'artifactName', 'artifactDigest'
  ];
  v_staging_keys constant text[] := array[
    'runId', 'runAttempt', 'workflowPath', 'artifactName', 'artifactId', 'artifactDigest',
    'deploymentId', 'deployedAt', 'environment', 'webOrigin', 'apiOrigin'
  ];
  v_staging_string_keys constant text[] := array[
    'runId', 'workflowPath', 'artifactName', 'artifactDigest', 'deploymentId',
    'deployedAt', 'environment', 'webOrigin', 'apiOrigin'
  ];
  v_artifact_keys constant text[] := array[
    'buildId', 'buildManifestSha256', 'migrationVersion'
  ];
  v_migration_keys constant text[] := array[
    'projectRef', 'remoteHistorySha256', 'verifiedAt'
  ];
  v_migration_string_keys constant text[] := array[
    'projectRef', 'remoteHistorySha256', 'verifiedAt'
  ];
  v_provider_keys constant text[] := array[
    'evidenceSha256', 'collectedAt', 'workers'
  ];
  v_provider_worker_keys constant text[] := array[
    'workerName', 'versionId', 'deploymentId', 'versionCreatedAt', 'deploymentCreatedAt'
  ];
  v_timestamp_pattern constant text :=
    '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,9})?(Z|[+-][0-9]{2}:[0-9]{2})$';
  v_identity jsonb;
  v_provenance jsonb;
  v_ci jsonb;
  v_staging jsonb;
  v_artifact jsonb;
  v_migration jsonb;
  v_provider jsonb;
  v_workers jsonb;
  v_worker jsonb;
  v_worker_names text[] := array[]::text[];
  v_identity_digest text;
  v_identity_canonical text;
  v_identity_sha256 bytea;
  v_recomputed_identity_sha256 bytea;
  v_source_revision text;
  v_deployment_id text;
  v_ci_run_id text;
  v_ci_run_attempt integer;
  v_staging_run_id text;
  v_staging_run_attempt integer;
  v_ci_artifact_id bigint;
  v_staging_artifact_id bigint;
  v_ci_artifact_id_number numeric;
  v_staging_artifact_id_number numeric;
  v_ci_run_attempt_number numeric;
  v_staging_run_attempt_number numeric;
  v_deployed_at timestamptz;
  v_migration_verified_at timestamptz;
  v_provider_collected_at timestamptz;
  v_worker_version_created_at timestamptz;
  v_worker_deployment_created_at timestamptz;
  v_origin text;
  v_authority text;
  v_host text;
  v_port integer;
  v_web_origin text;
  v_api_origin text;
  v_supabase_origin text;
  v_web_origin_normalized text;
  v_api_origin_normalized text;
  v_supabase_origin_normalized text;
  v_candidate_id uuid;
  v_existing_candidate platform_private.ac265_verified_candidates%rowtype;
  v_conflict_count bigint;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  v_identity := p_request -> 'identity';
  v_provenance := p_request -> 'provenance';
  if jsonb_typeof(v_identity) <> 'object'
     or not (v_identity ?& v_identity_keys)
     or (v_identity - v_identity_keys) <> '{}'::jsonb
     or jsonb_typeof(v_provenance) <> 'object'
     or not (v_provenance ?& v_provenance_keys)
     or (v_provenance - v_provenance_keys) <> '{}'::jsonb then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  v_ci := v_provenance -> 'ci';
  v_staging := v_provenance -> 'staging';
  v_artifact := v_provenance -> 'artifact';
  v_migration := v_provenance -> 'migration';
  v_provider := v_provenance -> 'provider';
  if jsonb_typeof(v_ci) <> 'object'
     or not (v_ci ?& v_ci_keys)
     or (v_ci - v_ci_keys) <> '{}'::jsonb
     or jsonb_typeof(v_staging) <> 'object'
     or not (v_staging ?& v_staging_keys)
     or (v_staging - v_staging_keys) <> '{}'::jsonb
     or jsonb_typeof(v_artifact) <> 'object'
     or not (v_artifact ?& v_artifact_keys)
     or (v_artifact - v_artifact_keys) <> '{}'::jsonb
     or jsonb_typeof(v_migration) <> 'object'
     or not (v_migration ?& v_migration_keys)
     or (v_migration - v_migration_keys) <> '{}'::jsonb
     or jsonb_typeof(v_provider) <> 'object'
     or not (v_provider ?& v_provider_keys)
     or (v_provider - v_provider_keys) <> '{}'::jsonb
     or jsonb_typeof(v_provider -> 'workers') <> 'array' then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  v_workers := v_provider -> 'workers';
  if jsonb_array_length(v_workers) <> 2 then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;
  if exists (
    select 1
    from jsonb_array_elements(v_workers) as worker(value)
    where jsonb_typeof(worker.value) <> 'object'
       or not (worker.value ?& v_provider_worker_keys)
       or (worker.value - v_provider_worker_keys) <> '{}'::jsonb
       or jsonb_typeof(worker.value -> 'workerName') <> 'string'
       or jsonb_typeof(worker.value -> 'versionId') <> 'string'
       or jsonb_typeof(worker.value -> 'deploymentId') <> 'string'
       or jsonb_typeof(worker.value -> 'versionCreatedAt') <> 'string'
       or jsonb_typeof(worker.value -> 'deploymentCreatedAt') <> 'string'
  ) then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  if jsonb_typeof(p_request -> 'criterion') <> 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') <> 'string'
     or jsonb_typeof(p_request -> 'identitySha256') <> 'string'
     or exists (
       select 1 from jsonb_each(v_identity) as property(key, value)
       where property.key = any (v_identity_string_keys)
         and jsonb_typeof(property.value) <> 'string'
     )
     or jsonb_typeof(v_identity -> 'ciRunAttempt') <> 'number'
     or jsonb_typeof(v_identity -> 'stagingRunAttempt') <> 'number'
     or jsonb_typeof(v_provenance -> 'repository') <> 'string'
     or jsonb_typeof(v_provenance -> 'sourceRevision') <> 'string'
     or exists (
       select 1 from jsonb_each(v_ci) as property(key, value)
       where property.key = any (v_ci_string_keys)
         and jsonb_typeof(property.value) <> 'string'
     )
     or jsonb_typeof(v_ci -> 'runAttempt') <> 'number'
     or jsonb_typeof(v_ci -> 'artifactId') <> 'number'
     or exists (
       select 1 from jsonb_each(v_staging) as property(key, value)
       where property.key = any (v_staging_string_keys)
         and jsonb_typeof(property.value) <> 'string'
     )
     or jsonb_typeof(v_staging -> 'runAttempt') <> 'number'
     or jsonb_typeof(v_staging -> 'artifactId') <> 'number'
     or jsonb_typeof(v_artifact -> 'buildId') <> 'string'
     or jsonb_typeof(v_artifact -> 'buildManifestSha256') <> 'string'
     or jsonb_typeof(v_artifact -> 'migrationVersion') <> 'string'
     or exists (
       select 1 from jsonb_each(v_migration) as property(key, value)
       where property.key = any (v_migration_string_keys)
         and jsonb_typeof(property.value) <> 'string'
     )
     or jsonb_typeof(v_provider -> 'evidenceSha256') <> 'string'
     or jsonb_typeof(v_provider -> 'collectedAt') <> 'string' then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(v_workers) as worker(value)
    where exists (
      select 1 from jsonb_each(worker.value) as property(key, value)
      where property.key = any (array[
        'workerName', 'versionId', 'deploymentId', 'versionCreatedAt', 'deploymentCreatedAt'
      ])
        and jsonb_typeof(property.value) <> 'string'
    )
  ) then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  if p_request ->> 'criterion' <> 'P2-S09-AC-265'
     or p_request ->> 'schemaVersion' <> 'ac265-candidate-enrollment-v1'
     or (p_request ->> 'identitySha256') !~ '^[a-f0-9]{64}$'
     or v_identity ->> 'environment' <> 'staging'
     or (v_identity ->> 'ciRunId') !~ '^[1-9][0-9]{0,19}$'
     or (v_identity ->> 'stagingRunId') !~ '^[1-9][0-9]{0,19}$'
     or (v_identity ->> 'sourceRevision') !~ '^[a-f0-9]{40}$'
     or (v_identity ->> 'deploymentId') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or (v_identity ->> 'buildId') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or (v_identity ->> 'buildManifestSha256') !~ '^[a-f0-9]{64}$'
     or (v_identity ->> 'artifactSha256') !~ '^[a-f0-9]{64}$'
     or (v_identity ->> 'hostingAccountId') !~ '^[a-f0-9]{32}$'
     or v_identity ->> 'hostingProjectId' <> 'wejammin-staging'
     or (v_identity ->> 'supabaseProjectRef') !~ '^[a-z0-9]{20}$'
     or (v_identity ->> 'migrationVersion') !~ '^[0-9]{14,20}$'
     or (v_identity ->> 'migrationSha256') !~ '^[a-f0-9]{64}$'
     or (v_identity ->> 'deployedAt') !~ v_timestamp_pattern
     or v_identity ->> 'apiOrigin' <> 'https://wejammin-api-staging.wejammin.workers.dev'
     or v_provenance ->> 'repository' <> 'WeJustJammin/nevrite-music'
     or v_provenance ->> 'sourceRevision' <> v_identity ->> 'sourceRevision'
     or (v_ci ->> 'runId') !~ '^[1-9][0-9]{0,19}$'
     or (v_ci ->> 'workflowPath') <> '.github/workflows/ci.yml'
     or length(v_ci ->> 'artifactName') > 200
     or (v_ci ->> 'artifactDigest') !~ '^sha256:[a-f0-9]{64}$'
     or (v_staging ->> 'runId') !~ '^[1-9][0-9]{0,19}$'
     or (v_staging ->> 'workflowPath') <> '.github/workflows/deploy-staging.yml'
     or (v_staging ->> 'artifactName') <> 'staging-verified-candidate'
     or (v_staging ->> 'artifactDigest') !~ '^sha256:[a-f0-9]{64}$'
     or (v_staging ->> 'deploymentId') <> v_identity ->> 'deploymentId'
     or (v_staging ->> 'deployedAt') <> v_identity ->> 'deployedAt'
     or (v_staging ->> 'environment') <> 'staging'
     or (v_staging ->> 'apiOrigin') <> 'https://wejammin-api-staging.wejammin.workers.dev'
     or (v_staging ->> 'webOrigin') <> v_identity ->> 'webOrigin'
     or (v_artifact ->> 'buildId') <> v_identity ->> 'buildId'
     or (v_artifact ->> 'buildManifestSha256') <> v_identity ->> 'buildManifestSha256'
     or (v_artifact ->> 'buildManifestSha256') !~ '^[a-f0-9]{64}$'
     or (v_artifact ->> 'migrationVersion') <> v_identity ->> 'migrationVersion'
     or (v_migration ->> 'projectRef') <> v_identity ->> 'supabaseProjectRef'
     or (v_migration ->> 'remoteHistorySha256') <> v_identity ->> 'migrationSha256'
     or (v_migration ->> 'remoteHistorySha256') !~ '^[a-f0-9]{64}$'
     or (v_migration ->> 'verifiedAt') !~ v_timestamp_pattern
     or (v_provider ->> 'evidenceSha256') !~ '^[a-f0-9]{64}$'
     or (v_provider ->> 'collectedAt') !~ v_timestamp_pattern then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  v_ci_run_attempt_number := (v_ci ->> 'runAttempt')::numeric;
  v_staging_run_attempt_number := (v_staging ->> 'runAttempt')::numeric;
  v_ci_artifact_id_number := (v_ci ->> 'artifactId')::numeric;
  v_staging_artifact_id_number := (v_staging ->> 'artifactId')::numeric;
  if (v_identity ->> 'ciRunAttempt')::numeric <> trunc((v_identity ->> 'ciRunAttempt')::numeric)
     or (v_identity ->> 'ciRunAttempt')::numeric < 1
     or (v_identity ->> 'ciRunAttempt')::numeric > 1000
     or (v_identity ->> 'stagingRunAttempt')::numeric <> trunc((v_identity ->> 'stagingRunAttempt')::numeric)
     or (v_identity ->> 'stagingRunAttempt')::numeric < 1
     or (v_identity ->> 'stagingRunAttempt')::numeric > 1000
     or v_ci_run_attempt_number <> trunc(v_ci_run_attempt_number)
     or v_ci_run_attempt_number < 1 or v_ci_run_attempt_number > 1000
     or v_staging_run_attempt_number <> trunc(v_staging_run_attempt_number)
     or v_staging_run_attempt_number < 1 or v_staging_run_attempt_number > 1000
     or v_ci_artifact_id_number <> trunc(v_ci_artifact_id_number)
     or v_ci_artifact_id_number < 1 or v_ci_artifact_id_number > 9007199254740991
     or v_staging_artifact_id_number <> trunc(v_staging_artifact_id_number)
     or v_staging_artifact_id_number < 1 or v_staging_artifact_id_number > 9007199254740991 then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  if (v_ci ->> 'runId') <> v_identity ->> 'ciRunId'
     or v_ci_run_attempt_number <> (v_identity ->> 'ciRunAttempt')::numeric
     or (v_ci ->> 'artifactName') <> 'workspace-build-' || (v_identity ->> 'sourceRevision')
     or (v_ci ->> 'artifactDigest') <> 'sha256:' || (v_identity ->> 'artifactSha256')
     or (v_staging ->> 'runId') <> v_identity ->> 'stagingRunId'
     or v_staging_run_attempt_number <> (v_identity ->> 'stagingRunAttempt')::numeric
     or (v_artifact ->> 'buildId') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or (v_identity ->> 'supabaseOrigin') <> 'https://' || (v_identity ->> 'supabaseProjectRef') || '.supabase.co' then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  v_source_revision := v_identity ->> 'sourceRevision';
  v_deployment_id := v_identity ->> 'deploymentId';
  v_ci_run_id := v_ci ->> 'runId';
  v_ci_run_attempt := v_ci_run_attempt_number::integer;
  v_staging_run_id := v_staging ->> 'runId';
  v_staging_run_attempt := v_staging_run_attempt_number::integer;
  v_ci_artifact_id := v_ci_artifact_id_number::bigint;
  v_staging_artifact_id := v_staging_artifact_id_number::bigint;
  v_identity_digest := p_request ->> 'identitySha256';

  v_web_origin := v_identity ->> 'webOrigin';
  v_api_origin := v_identity ->> 'apiOrigin';
  v_supabase_origin := v_identity ->> 'supabaseOrigin';
  for v_origin in
    select origin_value
    from (values (v_web_origin), (v_api_origin), (v_supabase_origin)) as origins(origin_value)
  loop
    if length(v_origin) > 2048
       or v_origin !~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?/?$' then
      raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
    end if;

    v_authority := substring(v_origin from '^https://([^/]+)');
    v_host := lower(split_part(v_authority, ':', 1));
    if v_authority ~ ':[0-9]+$' then
      v_port := split_part(v_authority, ':', 2)::integer;
      if v_port < 1 or v_port > 65535 then
        raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
      end if;
    end if;
    if v_host = 'localhost'
       or v_host like '%.localhost'
       or v_host like '%.local'
       or v_host ~ '^(0|10|127)([.][0-9]{1,3}){3}$'
       or v_host ~ '^(169[.]254|192[.]168)([.][0-9]{1,3}){2}$'
       or v_host ~ '^172[.](1[6-9]|2[0-9]|3[01])([.][0-9]{1,3}){2}$'
       or v_host ~ '^100[.](6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])([.][0-9]{1,3}){2}$' then
      raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
    end if;
  end loop;

  v_web_origin_normalized := lower(regexp_replace(v_web_origin, '(:443)?/?$', ''));
  v_api_origin_normalized := lower(regexp_replace(v_api_origin, '(:443)?/?$', ''));
  v_supabase_origin_normalized := lower(regexp_replace(v_supabase_origin, '(:443)?/?$', ''));
  if v_web_origin_normalized = v_api_origin_normalized
     or v_web_origin_normalized = v_supabase_origin_normalized
     or v_api_origin_normalized = v_supabase_origin_normalized
     or v_api_origin_normalized <> 'https://wejammin-api-staging.wejammin.workers.dev'
     or v_supabase_origin_normalized <> 'https://' || (v_identity ->> 'supabaseProjectRef') || '.supabase.co' then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  begin
    v_identity_sha256 := decode(v_identity_digest, 'hex');
    v_deployed_at := (v_identity ->> 'deployedAt')::timestamptz;
    v_migration_verified_at := (v_migration ->> 'verifiedAt')::timestamptz;
    v_provider_collected_at := (v_provider ->> 'collectedAt')::timestamptz;
  exception when others then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end;

  v_identity_canonical :=
    '{"environment":' || pg_catalog.to_json(v_identity ->> 'environment')::text ||
    ',"ciRunId":' || pg_catalog.to_json(v_identity ->> 'ciRunId')::text ||
    ',"ciRunAttempt":' || ((v_identity ->> 'ciRunAttempt')::numeric)::integer::text ||
    ',"stagingRunId":' || pg_catalog.to_json(v_identity ->> 'stagingRunId')::text ||
    ',"stagingRunAttempt":' || ((v_identity ->> 'stagingRunAttempt')::numeric)::integer::text ||
    ',"sourceRevision":' || pg_catalog.to_json(v_identity ->> 'sourceRevision')::text ||
    ',"deploymentId":' || pg_catalog.to_json(v_identity ->> 'deploymentId')::text ||
    ',"deployedAt":' || pg_catalog.to_json(v_identity ->> 'deployedAt')::text ||
    ',"buildId":' || pg_catalog.to_json(v_identity ->> 'buildId')::text ||
    ',"buildManifestSha256":' || pg_catalog.to_json(v_identity ->> 'buildManifestSha256')::text ||
    ',"artifactSha256":' || pg_catalog.to_json(v_identity ->> 'artifactSha256')::text ||
    ',"hostingAccountId":' || pg_catalog.to_json(v_identity ->> 'hostingAccountId')::text ||
    ',"hostingProjectId":' || pg_catalog.to_json(v_identity ->> 'hostingProjectId')::text ||
    ',"supabaseProjectRef":' || pg_catalog.to_json(v_identity ->> 'supabaseProjectRef')::text ||
    ',"migrationVersion":' || pg_catalog.to_json(v_identity ->> 'migrationVersion')::text ||
    ',"migrationSha256":' || pg_catalog.to_json(v_identity ->> 'migrationSha256')::text ||
    ',"webOrigin":' || pg_catalog.to_json(v_identity ->> 'webOrigin')::text ||
    ',"apiOrigin":' || pg_catalog.to_json(v_identity ->> 'apiOrigin')::text ||
    ',"supabaseOrigin":' || pg_catalog.to_json(v_identity ->> 'supabaseOrigin')::text ||
    '}';
  v_recomputed_identity_sha256 := extensions.digest(
    pg_catalog.convert_to(v_identity_canonical, 'UTF8'),
    'sha256'
  );

  if octet_length(v_identity_sha256) <> 32
     or v_identity_sha256 <> v_recomputed_identity_sha256
     or not isfinite(v_deployed_at)
     or not isfinite(v_migration_verified_at)
     or not isfinite(v_provider_collected_at)
     or v_migration_verified_at < v_deployed_at
     or v_migration_verified_at > clock_timestamp() + interval '5 seconds'
     or v_provider_collected_at < v_deployed_at
     or v_provider_collected_at > clock_timestamp() + interval '5 seconds' then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;
  v_identity_sha256 := v_recomputed_identity_sha256;

  for v_worker in select value from jsonb_array_elements(v_workers) as worker(value)
  loop
    if v_worker ->> 'workerName' not in ('wejammin-api-staging', 'wejammin-web-staging')
       or (v_worker ->> 'versionId') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or (v_worker ->> 'deploymentId') !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
       or (v_worker ->> 'versionCreatedAt') !~ v_timestamp_pattern
       or (v_worker ->> 'deploymentCreatedAt') !~ v_timestamp_pattern then
      raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
    end if;
    v_worker_names := array_append(v_worker_names, v_worker ->> 'workerName');
    begin
      v_worker_version_created_at := (v_worker ->> 'versionCreatedAt')::timestamptz;
      v_worker_deployment_created_at := (v_worker ->> 'deploymentCreatedAt')::timestamptz;
    exception when others then
      raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
    end;
    if not isfinite(v_worker_version_created_at)
       or not isfinite(v_worker_deployment_created_at)
       or v_worker_version_created_at < v_deployed_at
       or v_worker_version_created_at > v_worker_deployment_created_at
       or v_worker_deployment_created_at < v_deployed_at
       or v_worker_deployment_created_at > v_provider_collected_at then
      raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
    end if;
  end loop;

  if cardinality(v_worker_names) <> 2
     or not (v_worker_names @> array['wejammin-api-staging', 'wejammin-web-staging']::text[])
     or not (v_worker_names <@ array['wejammin-api-staging', 'wejammin-web-staging']::text[]) then
    raise exception 'AC265 candidate enrollment request rejected' using errcode = '22023';
  end if;

  insert into platform_private.ac265_verified_candidates (
    identity_sha256,
    source_revision,
    deployment_id,
    ci_run_id,
    ci_run_attempt,
    staging_run_id,
    staging_run_attempt,
    ci_artifact_id,
    staging_artifact_id,
    identity,
    provenance
  ) values (
    v_identity_sha256,
    v_source_revision,
    v_deployment_id,
    v_ci_run_id,
    v_ci_run_attempt,
    v_staging_run_id,
    v_staging_run_attempt,
    v_ci_artifact_id,
    v_staging_artifact_id,
    v_identity,
    v_provenance
  ) on conflict do nothing
  returning candidate_id into v_candidate_id;

  if not found then
    select count(distinct candidate.candidate_id)
      into v_conflict_count
    from platform_private.ac265_verified_candidates as candidate
    where candidate.identity_sha256 = v_identity_sha256
       or (candidate.source_revision = v_source_revision
           and candidate.deployment_id = v_deployment_id)
       or (candidate.ci_run_id = v_ci_run_id
           and candidate.ci_run_attempt = v_ci_run_attempt
           and candidate.staging_run_id = v_staging_run_id
           and candidate.staging_run_attempt = v_staging_run_attempt);

    if v_conflict_count <> 1 then
      return jsonb_build_object('status', 'conflict');
    end if;

    select candidate.*
      into v_existing_candidate
    from platform_private.ac265_verified_candidates as candidate
    where candidate.identity_sha256 = v_identity_sha256
       or (candidate.source_revision = v_source_revision
           and candidate.deployment_id = v_deployment_id)
       or (candidate.ci_run_id = v_ci_run_id
           and candidate.ci_run_attempt = v_ci_run_attempt
           and candidate.staging_run_id = v_staging_run_id
           and candidate.staging_run_attempt = v_staging_run_attempt)
    limit 1;

    if not found
       or v_existing_candidate.identity_sha256 <> v_identity_sha256
       or v_existing_candidate.source_revision <> v_source_revision
       or v_existing_candidate.deployment_id <> v_deployment_id
       or v_existing_candidate.identity <> v_identity
       or v_existing_candidate.provenance <> v_provenance then
      return jsonb_build_object('status', 'conflict');
    end if;

    v_candidate_id := v_existing_candidate.candidate_id;
  end if;

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-candidate-enrollment-v1',
    'candidateRef', 'ac265-candidate://staging/' || v_candidate_id::text,
    'identitySha256', v_identity_digest,
    'status', 'enrolled',
    'redacted', true
  );
end;
$function$;

revoke all on function platform_api.ac265_enroll_verified_candidate(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_enroll_verified_candidate(jsonb) to service_role;

create function platform_private.ac265_prepare_hosted_run_candidate(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'runId', 'identity', 'identitySha256', 'github'
  ];
  v_identity_keys constant text[] := array[
    'environment', 'ciRunId', 'ciRunAttempt', 'stagingRunId', 'stagingRunAttempt',
    'sourceRevision', 'deploymentId', 'deployedAt', 'buildId', 'buildManifestSha256',
    'artifactSha256', 'hostingAccountId', 'hostingProjectId', 'supabaseProjectRef',
    'migrationVersion', 'migrationSha256', 'webOrigin', 'apiOrigin', 'supabaseOrigin'
  ];
  v_identity_string_keys constant text[] := array[
    'environment', 'ciRunId', 'stagingRunId', 'sourceRevision', 'deploymentId',
    'deployedAt', 'buildId', 'buildManifestSha256', 'artifactSha256',
    'hostingAccountId', 'hostingProjectId', 'supabaseProjectRef', 'migrationVersion',
    'migrationSha256', 'webOrigin', 'apiOrigin', 'supabaseOrigin'
  ];
  v_github_keys constant text[] := array[
    'issuer', 'audience', 'subject', 'repository', 'repositoryId', 'repositoryOwner',
    'repositoryOwnerId', 'repositoryVisibility', 'ref', 'refProtected', 'eventName',
    'environment', 'runnerEnvironment', 'workflowRef', 'workflowSha', 'sha',
    'githubRunId', 'githubRunAttempt', 'jtiSha256', 'tokenIssuedAt', 'tokenNotBefore',
    'tokenExpiresAt'
  ];
  v_github_string_keys constant text[] := array[
    'issuer', 'audience', 'subject', 'repository', 'repositoryId', 'repositoryOwner',
    'repositoryOwnerId', 'repositoryVisibility', 'ref', 'eventName', 'environment',
    'runnerEnvironment', 'workflowRef', 'workflowSha', 'sha', 'githubRunId',
    'jtiSha256', 'tokenIssuedAt', 'tokenNotBefore', 'tokenExpiresAt'
  ];
  v_timestamp_pattern constant text :=
    '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,9})?(Z|[+-][0-9]{2}:[0-9]{2})$';
  v_identity jsonb;
  v_github jsonb;
  v_stable_request jsonb;
  v_run_id uuid;
  v_identity_sha256 bytea;
  v_jti_sha256 bytea;
  v_request_sha256 bytea;
  v_jti_authorization_id uuid;
  v_source_revision text;
  v_deployment_id text;
  v_github_run_id text;
  v_github_run_attempt integer;
  v_workflow_sha text;
  v_deployed_at timestamptz;
  v_token_issued_at timestamptz;
  v_token_not_before timestamptz;
  v_token_expires_at timestamptz;
  v_authorized_at timestamptz;
  v_expires_at timestamptz;
  v_origin text;
  v_authority text;
  v_host text;
  v_port integer;
  v_web_origin text;
  v_api_origin text;
  v_supabase_origin text;
  v_web_origin_normalized text;
  v_api_origin_normalized text;
  v_supabase_origin_normalized text;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_conflict_count bigint;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  v_identity := p_request -> 'identity';
  v_github := p_request -> 'github';
  if jsonb_typeof(v_identity) <> 'object'
     or not (v_identity ?& v_identity_keys)
     or (v_identity - v_identity_keys) <> '{}'::jsonb
     or jsonb_typeof(v_github) <> 'object'
     or not (v_github ?& v_github_keys)
     or (v_github - v_github_keys) <> '{}'::jsonb then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  if jsonb_typeof(p_request -> 'criterion') <> 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') <> 'string'
     or jsonb_typeof(p_request -> 'runId') <> 'string'
     or jsonb_typeof(p_request -> 'identitySha256') <> 'string'
     or exists (
       select 1
       from jsonb_each(v_identity) as property(key, value)
       where property.key = any (v_identity_string_keys)
         and jsonb_typeof(property.value) <> 'string'
     )
     or jsonb_typeof(v_identity -> 'ciRunAttempt') <> 'number'
     or jsonb_typeof(v_identity -> 'stagingRunAttempt') <> 'number'
     or exists (
       select 1
       from jsonb_each(v_github) as property(key, value)
       where property.key = any (v_github_string_keys)
         and jsonb_typeof(property.value) <> 'string'
     )
     or jsonb_typeof(v_github -> 'refProtected') <> 'boolean'
     or jsonb_typeof(v_github -> 'githubRunAttempt') <> 'number' then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  if jsonb_typeof(v_identity -> 'ciRunAttempt') <> 'number'
     or jsonb_typeof(v_identity -> 'stagingRunAttempt') <> 'number'
     or jsonb_typeof(v_github -> 'githubRunAttempt') <> 'number' then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  if (v_identity ->> 'ciRunAttempt')::numeric <> trunc((v_identity ->> 'ciRunAttempt')::numeric)
     or (v_identity ->> 'ciRunAttempt')::numeric < 1
     or (v_identity ->> 'ciRunAttempt')::numeric > 1000
     or (v_identity ->> 'stagingRunAttempt')::numeric <> trunc((v_identity ->> 'stagingRunAttempt')::numeric)
     or (v_identity ->> 'stagingRunAttempt')::numeric < 1
     or (v_identity ->> 'stagingRunAttempt')::numeric > 1000
     or (v_github ->> 'githubRunAttempt')::numeric <> trunc((v_github ->> 'githubRunAttempt')::numeric)
     or (v_github ->> 'githubRunAttempt')::numeric < 1
     or (v_github ->> 'githubRunAttempt')::numeric > 1000 then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  if p_request ->> 'criterion' <> 'P2-S09-AC-265'
     or p_request ->> 'schemaVersion' <> 'ac265-hosted-control-plane-v1'
     or (p_request ->> 'runId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or (p_request ->> 'identitySha256') !~ '^[a-f0-9]{64}$'
     or v_identity ->> 'environment' <> 'staging'
     or (v_identity ->> 'ciRunId') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or (v_identity ->> 'stagingRunId') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or (v_identity ->> 'sourceRevision') !~ '^[a-f0-9]{40}$'
     or (v_identity ->> 'deploymentId') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or (v_identity ->> 'buildId') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or (v_identity ->> 'buildManifestSha256') !~ '^[a-f0-9]{64}$'
     or (v_identity ->> 'artifactSha256') !~ '^[a-f0-9]{64}$'
     or (v_identity ->> 'hostingAccountId') !~ '^[a-f0-9]{32}$'
     or (v_identity ->> 'hostingProjectId') !~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'
     or (v_identity ->> 'supabaseProjectRef') !~ '^[a-z0-9]{20}$'
     or (v_identity ->> 'migrationVersion') !~ '^[0-9]{14,20}$'
     or (v_identity ->> 'migrationSha256') !~ '^[a-f0-9]{64}$'
     or (v_identity ->> 'deployedAt') !~ v_timestamp_pattern
     or (v_github ->> 'issuer') <> 'https://token.actions.githubusercontent.com'
     or (v_github ->> 'audience') <> 'urn:wejammin:ac265:staging-runner:v1'
     or (v_github ->> 'subject') <> 'repo:WeJustJammin/nevrite-music:environment:staging'
     or (v_github ->> 'repository') <> 'WeJustJammin/nevrite-music'
     or (v_github ->> 'repositoryId') <> '1297208152'
     or (v_github ->> 'repositoryOwner') <> 'WeJustJammin'
     or (v_github ->> 'repositoryOwnerId') <> '305953066'
     or (v_github ->> 'repositoryVisibility') <> 'public'
     or (v_github ->> 'ref') <> 'refs/heads/main'
     or (v_github -> 'refProtected') <> 'true'::jsonb
     or (v_github ->> 'eventName') <> 'workflow_dispatch'
     or (v_github ->> 'environment') <> 'staging'
     or (v_github ->> 'runnerEnvironment') <> 'github-hosted'
     or (v_github ->> 'workflowRef') <> 'WeJustJammin/nevrite-music/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main'
     or (v_github ->> 'workflowSha') !~ '^[a-f0-9]{40}$'
     or (v_github ->> 'sha') !~ '^[a-f0-9]{40}$'
     or (v_github ->> 'githubRunId') !~ '^[1-9][0-9]{0,19}$'
     or (v_github ->> 'jtiSha256') !~ '^[a-f0-9]{64}$'
     or (v_github ->> 'tokenIssuedAt') !~ v_timestamp_pattern
     or (v_github ->> 'tokenNotBefore') !~ v_timestamp_pattern
     or (v_github ->> 'tokenExpiresAt') !~ v_timestamp_pattern then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  v_source_revision := v_identity ->> 'sourceRevision';
  v_deployment_id := v_identity ->> 'deploymentId';
  v_github_run_id := v_github ->> 'githubRunId';
  v_github_run_attempt := (v_github ->> 'githubRunAttempt')::numeric::integer;
  v_workflow_sha := v_github ->> 'workflowSha';
  if v_source_revision <> v_github ->> 'sha'
     or v_source_revision <> v_workflow_sha then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  v_web_origin := v_identity ->> 'webOrigin';
  v_api_origin := v_identity ->> 'apiOrigin';
  v_supabase_origin := v_identity ->> 'supabaseOrigin';
  for v_origin in
    select origin_value
    from (values (v_web_origin), (v_api_origin), (v_supabase_origin)) as origins(origin_value)
  loop
    if length(v_origin) > 2048
       or v_origin !~ '^https://[A-Za-z0-9.-]+(:[0-9]{1,5})?/?$' then
      raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
    end if;

    v_authority := substring(v_origin from '^https://([^/]+)');
    v_host := lower(split_part(v_authority, ':', 1));
    if v_authority ~ ':[0-9]+$' then
      v_port := split_part(v_authority, ':', 2)::integer;
      if v_port < 1 or v_port > 65535 then
        raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
      end if;
    end if;
    if v_host = 'localhost'
       or v_host like '%.localhost'
       or v_host like '%.local'
       or v_host ~ '^(0|10|127)([.][0-9]{1,3}){3}$'
       or v_host ~ '^(169[.]254|192[.]168)([.][0-9]{1,3}){2}$'
       or v_host ~ '^172[.](1[6-9]|2[0-9]|3[01])([.][0-9]{1,3}){2}$'
       or v_host ~ '^100[.](6[4-9]|[7-9][0-9]|1[01][0-9]|12[0-7])([.][0-9]{1,3}){2}$' then
      raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
    end if;
  end loop;

  v_web_origin_normalized := lower(regexp_replace(v_web_origin, '(:443)?/?$', ''));
  v_api_origin_normalized := lower(regexp_replace(v_api_origin, '(:443)?/?$', ''));
  v_supabase_origin_normalized := lower(regexp_replace(v_supabase_origin, '(:443)?/?$', ''));
  if v_web_origin_normalized = v_api_origin_normalized
     or v_web_origin_normalized = v_supabase_origin_normalized
     or v_api_origin_normalized = v_supabase_origin_normalized
     or v_api_origin_normalized <> 'https://wejammin-api-staging.wejammin.workers.dev'
     or v_supabase_origin_normalized <> 'https://' || (v_identity ->> 'supabaseProjectRef') || '.supabase.co' then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  begin
    v_deployed_at := (v_identity ->> 'deployedAt')::timestamptz;
    v_token_issued_at := (v_github ->> 'tokenIssuedAt')::timestamptz;
    v_token_not_before := (v_github ->> 'tokenNotBefore')::timestamptz;
    v_token_expires_at := (v_github ->> 'tokenExpiresAt')::timestamptz;
    v_run_id := (p_request ->> 'runId')::uuid;
    v_identity_sha256 := decode(p_request ->> 'identitySha256', 'hex');
    v_jti_sha256 := decode(v_github ->> 'jtiSha256', 'hex');
  exception when others then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end;

  v_authorized_at := clock_timestamp();
  if not isfinite(v_deployed_at)
     or v_token_not_before > v_token_issued_at + interval '5 seconds'
     or v_token_issued_at > v_authorized_at + interval '5 seconds'
     or v_token_not_before > v_authorized_at
     or v_token_expires_at <= v_authorized_at
     or v_token_expires_at <= v_token_issued_at
     or v_token_expires_at - v_token_issued_at > interval '5 minutes' then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  v_expires_at := least(v_token_expires_at, v_authorized_at + interval '5 minutes');
  v_stable_request := p_request || jsonb_build_object(
    'github', v_github - array['jtiSha256', 'tokenIssuedAt', 'tokenNotBefore', 'tokenExpiresAt']
  );
  v_request_sha256 := extensions.digest(
    pg_catalog.convert_to(v_stable_request::text, 'UTF8'),
    'sha256'
  );

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(encode(v_jti_sha256, 'hex'), 265)
  );

  select replay.authorization_id
    into v_jti_authorization_id
  from platform_private.ac265_runner_authorization_jtis as replay
  where replay.jti_sha256 = v_jti_sha256;

  if found then
    select auth_row.*
      into v_authorization
    from platform_private.ac265_runner_authorizations as auth_row
    where auth_row.authorization_id = v_jti_authorization_id
    for update;

    if not found
       or v_authorization.request_sha256 <> v_request_sha256
       or v_authorization.run_id <> v_run_id
       or v_authorization.github_run_id <> v_github_run_id
       or v_authorization.github_run_attempt <> v_github_run_attempt
       or v_authorization.expires_at <= clock_timestamp() then
      return jsonb_build_object('status', 'conflict');
    end if;

    return jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-control-plane-v1',
      'authorizationRef', 'ac265-authorization://staging/' || v_authorization.authorization_id::text,
      'runId', v_authorization.run_id,
      'identitySha256', encode(v_authorization.identity_sha256, 'hex'),
      'sourceRevision', v_authorization.source_revision,
      'deploymentId', v_authorization.deployment_id,
      'githubRunId', v_authorization.github_run_id,
      'githubRunAttempt', v_authorization.github_run_attempt,
      'workflowSha', v_authorization.workflow_sha,
      'authorizedAt', to_char(v_authorization.authorized_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'expiresAt', to_char(v_authorization.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'state', 'authorized',
      'redacted', true
    );
  end if;

  insert into platform_private.ac265_runner_authorizations (
    run_id,
    identity_sha256,
    source_revision,
    deployment_id,
    github_run_id,
    github_run_attempt,
    workflow_sha,
    jti_sha256,
    request_sha256,
    authorized_at,
    expires_at
  ) values (
    v_run_id,
    v_identity_sha256,
    v_source_revision,
    v_deployment_id,
    v_github_run_id,
    v_github_run_attempt,
    v_workflow_sha,
    v_jti_sha256,
    v_request_sha256,
    v_authorized_at,
    v_expires_at
  )
  on conflict do nothing
  returning * into v_authorization;

  if found then
    insert into platform_private.ac265_runner_authorization_jtis (
      jti_sha256,
      authorization_id
    ) values (
      v_jti_sha256,
      v_authorization.authorization_id
    );

    return jsonb_build_object(
      'criterion', 'P2-S09-AC-265',
      'schemaVersion', 'ac265-hosted-control-plane-v1',
      'authorizationRef', 'ac265-authorization://staging/' || v_authorization.authorization_id::text,
      'runId', v_authorization.run_id,
      'identitySha256', encode(v_authorization.identity_sha256, 'hex'),
      'sourceRevision', v_authorization.source_revision,
      'deploymentId', v_authorization.deployment_id,
      'githubRunId', v_authorization.github_run_id,
      'githubRunAttempt', v_authorization.github_run_attempt,
      'workflowSha', v_authorization.workflow_sha,
      'authorizedAt', to_char(v_authorization.authorized_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'expiresAt', to_char(v_authorization.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'state', 'authorized',
      'redacted', true
    );
  end if;

  select count(distinct auth_row.authorization_id)
    into v_conflict_count
  from platform_private.ac265_runner_authorizations as auth_row
  where auth_row.run_id = v_run_id
     or auth_row.jti_sha256 = v_jti_sha256
     or (auth_row.github_run_id = v_github_run_id
         and auth_row.github_run_attempt = v_github_run_attempt);

  if v_conflict_count <> 1 then
    return jsonb_build_object('status', 'conflict');
  end if;

  select auth_row.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as auth_row
  where auth_row.run_id = v_run_id
     or auth_row.jti_sha256 = v_jti_sha256
     or (auth_row.github_run_id = v_github_run_id
         and auth_row.github_run_attempt = v_github_run_attempt)
  limit 1
  for update;

  if not found
     or v_authorization.request_sha256 <> v_request_sha256
     or v_authorization.expires_at <= clock_timestamp() then
    return jsonb_build_object('status', 'conflict');
  end if;

  insert into platform_private.ac265_runner_authorization_jtis (
    jti_sha256,
    authorization_id
  ) values (
    v_jti_sha256,
    v_authorization.authorization_id
  );

  return jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-control-plane-v1',
    'authorizationRef', 'ac265-authorization://staging/' || v_authorization.authorization_id::text,
    'runId', v_authorization.run_id,
    'identitySha256', encode(v_authorization.identity_sha256, 'hex'),
    'sourceRevision', v_authorization.source_revision,
    'deploymentId', v_authorization.deployment_id,
    'githubRunId', v_authorization.github_run_id,
    'githubRunAttempt', v_authorization.github_run_attempt,
    'workflowSha', v_authorization.workflow_sha,
    'authorizedAt', to_char(v_authorization.authorized_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'expiresAt', to_char(v_authorization.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'state', 'authorized',
    'redacted', true
  );
end;
$function$;

revoke all on function platform_private.ac265_prepare_hosted_run_candidate(jsonb)
  from public, anon, authenticated, service_role;

create function platform_api.ac265_prepare_hosted_run(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'runId', 'candidateRef', 'github'
  ];
  v_candidate_ref_pattern constant text :=
    '^ac265-candidate://staging/([0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$';
  v_candidate_id_text text;
  v_candidate_id uuid;
  v_candidate platform_private.ac265_verified_candidates%rowtype;
  v_github jsonb;
  v_internal_request jsonb;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') <> 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') <> 'string'
     or jsonb_typeof(p_request -> 'runId') <> 'string'
     or jsonb_typeof(p_request -> 'candidateRef') <> 'string'
     or jsonb_typeof(p_request -> 'github') <> 'object'
     or p_request ->> 'criterion' <> 'P2-S09-AC-265'
     or p_request ->> 'schemaVersion' <> 'ac265-hosted-control-plane-v1'
     or (p_request ->> 'runId') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
     or (p_request ->> 'candidateRef') !~ v_candidate_ref_pattern then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end if;

  v_candidate_id_text := substring(p_request ->> 'candidateRef' from v_candidate_ref_pattern);
  begin
    v_candidate_id := v_candidate_id_text::uuid;
  exception when others then
    raise exception 'AC265 prepare-run request rejected' using errcode = '22023';
  end;

  select candidate.*
    into v_candidate
  from platform_private.ac265_verified_candidates as candidate
  where candidate.candidate_id = v_candidate_id;

  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_github := p_request -> 'github';
  if (v_github ->> 'sha') is distinct from v_candidate.source_revision
     or (v_github ->> 'workflowSha') is distinct from v_candidate.source_revision then
    return jsonb_build_object('status', 'conflict');
  end if;

  v_internal_request := (p_request - 'candidateRef') || jsonb_build_object(
    'identity', v_candidate.identity,
    'identitySha256', encode(v_candidate.identity_sha256, 'hex')
  );
  return platform_private.ac265_prepare_hosted_run_candidate(v_internal_request);
end;
$function$;

revoke all on function platform_api.ac265_prepare_hosted_run(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_prepare_hosted_run(jsonb) to service_role;

comment on table platform_private.ac265_verified_candidates is
  'Private immutable full identity and provenance registry populated only after the protected verifier has validated the complete staging candidate tuple.';
comment on function platform_api.ac265_enroll_verified_candidate(jsonb) is
  'Idempotently enrolls strict verified staging candidate provenance and returns only a server-generated opaque candidate reference.';
comment on function platform_private.ac265_reject_verified_candidate_mutation() is
  'Rejects every update, delete, and truncate of the immutable AC265 candidate registry.';
comment on table platform_private.ac265_runner_authorizations is
  'Digest-only authorization rows with a canonical stable-request digest for short-lived staging AC265 hosted runner authorizations.';
comment on table platform_private.ac265_runner_authorization_jtis is
  'Digest-only registry of every OIDC JTI accepted for an AC265 authorization, including recovery retries.';
comment on function platform_api.ac265_prepare_hosted_run(jsonb) is
  'Resolves an enrolled immutable candidate reference, verifies its source against the protected GitHub OIDC identity, and creates or recovers a live short-lived authorization.';
comment on function platform_private.ac265_prepare_hosted_run_candidate(jsonb) is
  'Internal-only prepare implementation called after the public RPC resolves the caller reference to registry-owned identity metadata.';
