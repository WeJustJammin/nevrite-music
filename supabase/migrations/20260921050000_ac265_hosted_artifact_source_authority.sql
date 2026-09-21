-- AC265 CP-04d: server-authoritative hosted-artifact source manifests.
--
-- This migration is intentionally forward-only.  It stores only references,
-- digests, key identifiers, and server-derived run bindings; raw artifact or
-- attestation bytes, keys, and locators never enter the database.  A manifest
-- can contain one through 256 sources.  Source-set and kind completeness are
-- server-derived bookkeeping only; they do not prove AC265 acceptance or
-- signature verification.

create table platform_private.ac265_hosted_artifact_manifests (
  manifest_id uuid primary key default extensions.gen_random_uuid(),
  manifest_ref text not null,
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id),
  candidate_id uuid not null,
  run_id uuid not null,
  identity_sha256 bytea not null,
  environment text not null,
  source_revision text not null,
  deployment_id text not null,
  hosting_project_id text not null,
  supabase_project_ref text not null,
  source_count smallint not null,
  source_set_complete boolean not null,
  kind_complete boolean not null,
  registered_at timestamptz not null,
  idempotency_ref text not null,
  request_sha256 bytea not null,
  constraint ac265_hosted_artifact_manifests_ref_unique
    unique (manifest_ref),
  constraint ac265_hosted_artifact_manifests_authorization_unique
    unique (authorization_id),
  constraint ac265_hosted_artifact_manifests_idempotency_unique
    unique (authorization_id, idempotency_ref),
  constraint ac265_hosted_artifact_manifests_ref_shape
    check (
      manifest_ref ~ '^ac265-artifact-manifest://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_hosted_artifact_manifests_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_hosted_artifact_manifests_environment
    check (environment = 'staging'),
  constraint ac265_hosted_artifact_manifests_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_hosted_artifact_manifests_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_hosted_artifact_manifests_hosting_project_id_format
    check (hosting_project_id = 'wejammin-staging'),
  constraint ac265_hosted_artifact_manifests_supabase_project_ref_format
    check (supabase_project_ref ~ '^[a-z0-9]{20}$'),
  constraint ac265_hosted_artifact_manifests_source_count_range
    check (source_count between 1 and 256),
  constraint ac265_hosted_artifact_manifests_idempotency_ref_shape
    check (
      idempotency_ref ~ '^ac265-idempotency://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_hosted_artifact_manifests_request_sha256_length
    check (octet_length(request_sha256) = 32)
);

create table platform_private.ac265_hosted_artifact_manifest_finalizations (
  finalization_id uuid primary key default extensions.gen_random_uuid(),
  manifest_id uuid not null
    references platform_private.ac265_hosted_artifact_manifests (manifest_id),
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id),
  finalization_ref text not null,
  manifest_sha256 bytea not null,
  finalized_at timestamptz not null,
  request_sha256 bytea not null,
  constraint ac265_hosted_artifact_finalizations_manifest_unique
    unique (manifest_id),
  constraint ac265_hosted_artifact_finalizations_ref_unique
    unique (finalization_ref),
  constraint ac265_hosted_artifact_finalizations_digest_unique
    unique (manifest_sha256),
  constraint ac265_hosted_artifact_finalizations_ref_shape
    check (
      finalization_ref ~ '^ac265-finalization://staging/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_hosted_artifact_finalizations_manifest_sha256_length
    check (octet_length(manifest_sha256) = 32),
  constraint ac265_hosted_artifact_finalizations_request_sha256_length
    check (octet_length(request_sha256) = 32)
);

create table platform_private.ac265_hosted_artifact_replay_ledger (
  artifact_ref text primary key,
  manifest_id uuid not null
    references platform_private.ac265_hosted_artifact_manifests (manifest_id),
  authorization_id uuid not null
    references platform_private.ac265_runner_authorizations (authorization_id),
  candidate_id uuid not null,
  run_id uuid not null,
  identity_sha256 bytea not null,
  source_revision text not null,
  deployment_id text not null,
  hosting_project_id text not null,
  supabase_project_ref text not null,
  artifact_kind text not null,
  artifact_sha256 bytea not null,
  attestation_sha256 bytea not null,
  attestation_key_id text not null,
  subject_sha256 bytea not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  first_seen_at timestamptz not null,
  constraint ac265_hosted_artifact_replay_ref_shape
    check (
      artifact_ref ~ '^ac265-(receipt://server|evidence://blob)/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_hosted_artifact_replay_kind
    check (
      (artifact_kind = 'server_receipt' and artifact_ref like 'ac265-receipt://server/%')
      or (artifact_kind = 'execution_evidence' and artifact_ref like 'ac265-evidence://blob/%')
    ),
  constraint ac265_hosted_artifact_replay_artifact_sha256_length
    check (octet_length(artifact_sha256) = 32),
  constraint ac265_hosted_artifact_replay_attestation_sha256_length
    check (octet_length(attestation_sha256) = 32),
  constraint ac265_hosted_artifact_replay_identity_sha256_length
    check (octet_length(identity_sha256) = 32),
  constraint ac265_hosted_artifact_replay_subject_sha256_length
    check (octet_length(subject_sha256) = 32),
  constraint ac265_hosted_artifact_replay_source_revision_format
    check (source_revision ~ '^[a-f0-9]{40}$'),
  constraint ac265_hosted_artifact_replay_deployment_id_format
    check (deployment_id ~ '^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$'),
  constraint ac265_hosted_artifact_replay_hosting_project_id_format
    check (hosting_project_id = 'wejammin-staging'),
  constraint ac265_hosted_artifact_replay_supabase_project_ref_format
    check (supabase_project_ref ~ '^[a-z0-9]{20}$'),
  constraint ac265_hosted_artifact_replay_attestation_key_id_format
    check (attestation_key_id ~ '^[a-z][a-z0-9_.-]{1,95}$'),
  constraint ac265_hosted_artifact_replay_expiry_order
    check (
      expires_at > issued_at
      and expires_at <= issued_at + interval '5 minutes'
    )
);

create table platform_private.ac265_hosted_artifact_manifest_sources (
  source_id uuid primary key default extensions.gen_random_uuid(),
  manifest_id uuid not null
    references platform_private.ac265_hosted_artifact_manifests (manifest_id),
  source_ordinal smallint not null,
  artifact_ref text not null
    references platform_private.ac265_hosted_artifact_replay_ledger (artifact_ref),
  artifact_kind text not null,
  artifact_sha256 bytea not null,
  attestation_sha256 bytea not null,
  attestation_key_id text not null,
  subject_sha256 bytea not null,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  constraint ac265_hosted_artifact_sources_manifest_ordinal_unique
    unique (manifest_id, source_ordinal),
  constraint ac265_hosted_artifact_sources_manifest_ref_unique
    unique (manifest_id, artifact_ref),
  constraint ac265_hosted_artifact_sources_ordinal_range
    check (source_ordinal between 1 and 256),
  constraint ac265_hosted_artifact_sources_ref_shape
    check (
      artifact_ref ~ '^ac265-(receipt://server|evidence://blob)/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    ),
  constraint ac265_hosted_artifact_sources_kind
    check (
      (artifact_kind = 'server_receipt' and artifact_ref like 'ac265-receipt://server/%')
      or (artifact_kind = 'execution_evidence' and artifact_ref like 'ac265-evidence://blob/%')
    ),
  constraint ac265_hosted_artifact_sources_artifact_sha256_length
    check (octet_length(artifact_sha256) = 32),
  constraint ac265_hosted_artifact_sources_attestation_sha256_length
    check (octet_length(attestation_sha256) = 32),
  constraint ac265_hosted_artifact_sources_subject_sha256_length
    check (octet_length(subject_sha256) = 32),
  constraint ac265_hosted_artifact_sources_attestation_key_id_format
    check (attestation_key_id ~ '^[a-z][a-z0-9_.-]{1,95}$'),
  constraint ac265_hosted_artifact_sources_expiry_order
    check (
      expires_at > issued_at
      and expires_at <= issued_at + interval '5 minutes'
    )
);

create function platform_private.ac265_reject_hosted_artifact_manifest_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 hosted-artifact manifests are immutable'
    using errcode = '55000';
end;
$function$;

create function platform_private.ac265_reject_hosted_artifact_source_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 hosted-artifact manifest sources are immutable'
    using errcode = '55000';
end;
$function$;

create function platform_private.ac265_reject_hosted_artifact_replay_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 hosted-artifact replay ledger is immutable'
    using errcode = '55000';
end;
$function$;

create function platform_private.ac265_reject_hosted_artifact_finalization_mutation()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $function$
begin
  raise exception 'AC265 hosted-artifact manifest finalization is immutable'
    using errcode = '55000';
end;
$function$;

create function platform_private.ac265_validate_hosted_artifact_manifest_binding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from platform_private.ac265_runner_authorizations as authz
    join platform_private.ac265_verified_candidates as candidate
      on candidate.candidate_id = new.candidate_id
     and candidate.identity_sha256 = authz.identity_sha256
     and candidate.source_revision = authz.source_revision
     and candidate.deployment_id = authz.deployment_id
     and candidate.identity ->> 'environment' = 'staging'
     and candidate.identity ->> 'hostingProjectId' = new.hosting_project_id
     and candidate.identity ->> 'supabaseProjectRef' = new.supabase_project_ref
    where authz.authorization_id = new.authorization_id
      and authz.run_id = new.run_id
      and authz.identity_sha256 = new.identity_sha256
      and authz.source_revision = new.source_revision
      and authz.deployment_id = new.deployment_id
  ) then
    raise exception 'AC265 hosted-artifact manifest binding is not server-authorized'
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

create function platform_private.ac265_validate_hosted_artifact_finalization_binding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from platform_private.ac265_hosted_artifact_manifests as manifest
    where manifest.manifest_id = new.manifest_id
      and manifest.authorization_id = new.authorization_id
  ) then
    raise exception 'AC265 hosted-artifact finalization binding is not manifest-authorized'
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

create function platform_private.ac265_validate_hosted_artifact_replay_binding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from platform_private.ac265_hosted_artifact_manifests as manifest
    where manifest.manifest_id = new.manifest_id
      and manifest.authorization_id = new.authorization_id
      and manifest.candidate_id = new.candidate_id
      and manifest.run_id = new.run_id
      and manifest.identity_sha256 = new.identity_sha256
      and manifest.source_revision = new.source_revision
      and manifest.deployment_id = new.deployment_id
      and manifest.hosting_project_id = new.hosting_project_id
      and manifest.supabase_project_ref = new.supabase_project_ref
  ) then
    raise exception 'AC265 hosted-artifact replay binding is not manifest-authorized'
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

create function platform_private.ac265_validate_hosted_artifact_source_binding()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from platform_private.ac265_hosted_artifact_replay_ledger as replay
    where replay.artifact_ref = new.artifact_ref
      and replay.manifest_id = new.manifest_id
      and replay.artifact_kind = new.artifact_kind
      and replay.artifact_sha256 = new.artifact_sha256
      and replay.attestation_sha256 = new.attestation_sha256
      and replay.attestation_key_id = new.attestation_key_id
      and replay.subject_sha256 = new.subject_sha256
      and replay.issued_at = new.issued_at
      and replay.expires_at = new.expires_at
  ) then
    raise exception 'AC265 hosted-artifact source binding is not replay-authorized'
      using errcode = '23514';
  end if;
  return new;
end;
$function$;

create function platform_private.ac265_validate_hosted_artifact_manifest_completeness()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not new.source_set_complete then
    raise exception 'AC265 hosted-artifact source-set completeness must be server-derived'
      using errcode = '23514';
  end if;
  if (
    select count(*)
    from platform_private.ac265_hosted_artifact_manifest_sources as source
    where source.manifest_id = new.manifest_id
  ) <> new.source_count then
    raise exception 'AC265 hosted-artifact manifest source count is incomplete'
      using errcode = '23514';
  end if;
  if new.kind_complete is distinct from (
    exists (
      select 1
      from platform_private.ac265_hosted_artifact_manifest_sources as source
      where source.manifest_id = new.manifest_id
        and source.artifact_kind = 'server_receipt'
    )
    and exists (
      select 1
      from platform_private.ac265_hosted_artifact_manifest_sources as source
      where source.manifest_id = new.manifest_id
        and source.artifact_kind = 'execution_evidence'
    )
  ) then
    raise exception 'AC265 hosted-artifact kind completeness is not server-derived'
      using errcode = '23514';
  end if;
  return null;
end;
$function$;

revoke all on function platform_private.ac265_reject_hosted_artifact_manifest_mutation()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_reject_hosted_artifact_source_mutation()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_reject_hosted_artifact_replay_mutation()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_reject_hosted_artifact_finalization_mutation()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_validate_hosted_artifact_manifest_binding()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_validate_hosted_artifact_finalization_binding()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_validate_hosted_artifact_replay_binding()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_validate_hosted_artifact_source_binding()
  from public, anon, authenticated, service_role;
revoke all on function platform_private.ac265_validate_hosted_artifact_manifest_completeness()
  from public, anon, authenticated, service_role;

create trigger ac265_hosted_artifact_manifests_are_immutable
  before update or delete or truncate
  on platform_private.ac265_hosted_artifact_manifests
  for each statement
  execute function platform_private.ac265_reject_hosted_artifact_manifest_mutation();

create trigger ac265_hosted_artifact_manifests_binding_is_server_derived
  before insert
  on platform_private.ac265_hosted_artifact_manifests
  for each row
  execute function platform_private.ac265_validate_hosted_artifact_manifest_binding();

create trigger ac265_hosted_artifact_manifest_finalizations_are_immutable
  before update or delete or truncate
  on platform_private.ac265_hosted_artifact_manifest_finalizations
  for each statement
  execute function platform_private.ac265_reject_hosted_artifact_finalization_mutation();

create trigger ac265_hosted_artifact_manifest_finalizations_binding_is_manifest_derived
  before insert
  on platform_private.ac265_hosted_artifact_manifest_finalizations
  for each row
  execute function platform_private.ac265_validate_hosted_artifact_finalization_binding();

create trigger ac265_hosted_artifact_manifest_sources_are_immutable
  before update or delete or truncate
  on platform_private.ac265_hosted_artifact_manifest_sources
  for each statement
  execute function platform_private.ac265_reject_hosted_artifact_source_mutation();

create trigger ac265_hosted_artifact_manifest_sources_binding_is_replay_derived
  before insert
  on platform_private.ac265_hosted_artifact_manifest_sources
  for each row
  execute function platform_private.ac265_validate_hosted_artifact_source_binding();

create trigger ac265_hosted_artifact_replay_ledger_are_immutable
  before update or delete or truncate
  on platform_private.ac265_hosted_artifact_replay_ledger
  for each statement
  execute function platform_private.ac265_reject_hosted_artifact_replay_mutation();

create trigger ac265_hosted_artifact_replay_binding_is_manifest_derived
  before insert
  on platform_private.ac265_hosted_artifact_replay_ledger
  for each row
  execute function platform_private.ac265_validate_hosted_artifact_replay_binding();

create constraint trigger ac265_hosted_artifact_manifests_completeness_is_valid
  after insert on platform_private.ac265_hosted_artifact_manifests
  deferrable initially deferred
  for each row
  execute function platform_private.ac265_validate_hosted_artifact_manifest_completeness();

alter table platform_private.ac265_hosted_artifact_manifests enable row level security;
alter table platform_private.ac265_hosted_artifact_manifests force row level security;
alter table platform_private.ac265_hosted_artifact_manifest_finalizations enable row level security;
alter table platform_private.ac265_hosted_artifact_manifest_finalizations force row level security;
alter table platform_private.ac265_hosted_artifact_replay_ledger enable row level security;
alter table platform_private.ac265_hosted_artifact_replay_ledger force row level security;
alter table platform_private.ac265_hosted_artifact_manifest_sources enable row level security;
alter table platform_private.ac265_hosted_artifact_manifest_sources force row level security;

revoke all on table platform_private.ac265_hosted_artifact_manifests
  from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_hosted_artifact_manifest_finalizations
  from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_hosted_artifact_replay_ledger
  from public, anon, authenticated, service_role;
revoke all on table platform_private.ac265_hosted_artifact_manifest_sources
  from public, anon, authenticated, service_role;

create function platform_private.ac265_build_hosted_artifact_manifest_envelope(
  p_manifest_id uuid
)
returns jsonb
language sql
security definer
set search_path = ''
as $function$
  select jsonb_build_object(
    'criterion', 'P2-S09-AC-265',
    'schemaVersion', 'ac265-hosted-artifact-source-manifest-v1',
    'manifestId', manifest.manifest_id,
    'manifestRef', manifest.manifest_ref,
    'authorizationRef', 'ac265-authorization://staging/' || manifest.authorization_id::text,
    'authorization', jsonb_build_object(
      'authorizedAt', to_char(authz.authorized_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
      'expiresAt', to_char(authz.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    ),
    'idempotencyRef', manifest.idempotency_ref,
    'candidateId', manifest.candidate_id,
    'runId', manifest.run_id,
    'identitySha256', encode(manifest.identity_sha256, 'hex'),
    'environment', manifest.environment,
    'sourceRevision', manifest.source_revision,
    'deploymentId', manifest.deployment_id,
    'hostingProjectId', manifest.hosting_project_id,
    'supabaseProjectRef', manifest.supabase_project_ref,
    'sourceCount', manifest.source_count,
    'sourceSetComplete', manifest.source_set_complete,
    'kindComplete', manifest.kind_complete,
    'registeredAt', to_char(manifest.registered_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
    'manifestSha256', case
      when finalization.manifest_sha256 is null then null
      else encode(finalization.manifest_sha256, 'hex')
    end,
    'finalizationRef', finalization.finalization_ref,
    'finalizedAt', case
      when finalization.finalized_at is null then null
      else to_char(finalization.finalized_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
    end,
    'lifecycle', case
      when finalization.finalization_id is null then 'registered'
      else 'finalized'
    end,
    'sources', (
      select coalesce(
        jsonb_agg(
          jsonb_build_object(
            'ordinal', source.source_ordinal,
            'kind', source.artifact_kind,
            'artifactRef', source.artifact_ref,
            'artifactSha256', encode(source.artifact_sha256, 'hex'),
            'attestationSha256', encode(source.attestation_sha256, 'hex'),
            'attestationKeyId', source.attestation_key_id,
            'subjectSha256', encode(source.subject_sha256, 'hex'),
            'issuedAt', to_char(source.issued_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'expiresAt', to_char(source.expires_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')
          ) order by source.source_ordinal
        ),
        '[]'::jsonb
      )
      from platform_private.ac265_hosted_artifact_manifest_sources as source
      where source.manifest_id = manifest.manifest_id
    ),
    'redacted', true
  )
  from platform_private.ac265_hosted_artifact_manifests as manifest
  join platform_private.ac265_runner_authorizations as authz
    on authz.authorization_id = manifest.authorization_id
  left join platform_private.ac265_hosted_artifact_manifest_finalizations as finalization
    on finalization.manifest_id = manifest.manifest_id
  where manifest.manifest_id = p_manifest_id;
$function$;

revoke all on function platform_private.ac265_build_hosted_artifact_manifest_envelope(uuid)
  from public, anon, authenticated, service_role;

create function platform_api.ac265_hosted_artifact_manifest_register(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'idempotencyRef', 'sources'
  ];
  v_source_keys constant text[] := array[
    'kind', 'artifactRef', 'artifactSha256', 'attestationSha256', 'attestationKeyId',
    'subjectSha256', 'issuedAt', 'expiresAt'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_idempotency_ref_pattern constant text :=
    '^ac265-idempotency://staging/(' || v_uuid_pattern || ')$';
  v_artifact_ref_pattern constant text :=
    '^ac265-(receipt://server|evidence://blob)/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_request_sha256 bytea;
  v_canonical_request jsonb;
  v_sources jsonb;
  v_now timestamptz;
  v_source jsonb;
  v_source_ref text;
  v_source_kind text;
  v_source_ordinal integer;
  v_source_count integer;
  v_source_set_complete boolean;
  v_kind_complete boolean;
  v_source_issued_at timestamptz;
  v_source_expires_at timestamptz;
  v_manifest_id uuid;
  v_manifest_ref text;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_candidate platform_private.ac265_verified_candidates%rowtype;
  v_existing platform_private.ac265_hosted_artifact_manifests%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'idempotencyRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'sources') is distinct from 'array'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '')
        <> 'ac265-hosted-artifact-source-manifest-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'idempotencyRef', '') !~ v_idempotency_ref_pattern
     or jsonb_array_length(p_request -> 'sources') not between 1 and 256 then
    raise exception 'AC265 hosted-artifact manifest request rejected'
      using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(
      p_request ->> 'authorizationRef' from v_authorization_ref_pattern
    )::uuid;
  exception when others then
    raise exception 'AC265 hosted-artifact manifest request rejected'
      using errcode = '22023';
  end;

  select coalesce(
    jsonb_agg(item.value order by (item.value ->> 'artifactRef') collate "C"),
    '[]'::jsonb
  )
    into v_sources
  from jsonb_array_elements(p_request -> 'sources') as item(value);
  v_canonical_request := jsonb_set(p_request, '{sources}', v_sources);
  v_source_count := jsonb_array_length(v_sources);
  v_source_set_complete := true;
  v_request_sha256 := extensions.digest(
    convert_to(v_canonical_request::text, 'utf8'), 'sha256'
  );
  v_now := clock_timestamp();

  for v_source, v_source_ordinal in
    select value, ordinal::integer
    from jsonb_array_elements(v_sources) with ordinality as item(value, ordinal)
  loop
    if jsonb_typeof(v_source) <> 'object'
       or not (v_source ?& v_source_keys)
       or (v_source - v_source_keys) <> '{}'::jsonb
       or exists (
         select 1
         from unnest(v_source_keys) as required(key)
         where jsonb_typeof(v_source -> required.key) is distinct from 'string'
       ) then
      raise exception 'AC265 hosted-artifact source request rejected'
        using errcode = '22023';
    end if;

    v_source_kind := v_source ->> 'kind';
    v_source_ref := v_source ->> 'artifactRef';
    if v_source_kind not in ('server_receipt', 'execution_evidence')
       or v_source_ref !~ v_artifact_ref_pattern
       or (v_source_kind = 'server_receipt'
           and v_source_ref not like 'ac265-receipt://server/%')
       or (v_source_kind = 'execution_evidence'
           and v_source_ref not like 'ac265-evidence://blob/%')
       or (v_source ->> 'artifactSha256') !~ '^[a-f0-9]{64}$'
       or (v_source ->> 'attestationSha256') !~ '^[a-f0-9]{64}$'
       or (v_source ->> 'subjectSha256') !~ '^[a-f0-9]{64}$'
       or (v_source ->> 'attestationKeyId') !~ '^[a-z][a-z0-9_.-]{1,95}$'
       or (v_source ->> 'issuedAt') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,9})?(Z|[+-][0-9]{2}:[0-9]{2})$'
       or (v_source ->> 'expiresAt') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}([.][0-9]{1,9})?(Z|[+-][0-9]{2}:[0-9]{2})$' then
      raise exception 'AC265 hosted-artifact source request rejected'
        using errcode = '22023';
    end if;

    if exists (
      select 1
      from jsonb_array_elements(v_sources) with ordinality as prior(value, ordinal)
      where prior.ordinal < v_source_ordinal
        and prior.value ->> 'artifactRef' = v_source_ref
    ) then
      raise exception 'AC265 hosted-artifact source references must be unique'
        using errcode = '22023';
    end if;

    begin
      v_source_issued_at := (v_source ->> 'issuedAt')::timestamptz;
      v_source_expires_at := (v_source ->> 'expiresAt')::timestamptz;
    exception when others then
      raise exception 'AC265 hosted-artifact source request rejected'
        using errcode = '22023';
    end;
    if v_source_expires_at <= v_source_issued_at
       or v_source_expires_at > v_source_issued_at + interval '5 minutes'
       or v_source_issued_at > v_now
       or v_source_expires_at <= v_now then
      raise exception 'AC265 hosted-artifact source window rejected'
        using errcode = '22023';
    end if;
  end loop;

  v_kind_complete :=
    exists (
      select 1
      from jsonb_array_elements(v_sources) as candidate(value)
      where candidate.value ->> 'kind' = 'server_receipt'
    )
    and exists (
      select 1
      from jsonb_array_elements(v_sources) as candidate(value)
      where candidate.value ->> 'kind' = 'execution_evidence'
    );

  -- Lock and validate the server authorization before any idempotent replay.
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.authorized_at <= v_now
    and authz.expires_at > v_now
  for update;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  -- Source windows use the half-open interval issued_at <= now < expires_at
  -- and must fit inside the server-issued authorization window.
  v_now := clock_timestamp();
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.authorized_at <= v_now
    and authz.expires_at > v_now
  for update;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;
  for v_source in
    select value from jsonb_array_elements(v_sources) as item(value)
  loop
    v_source_issued_at := (v_source ->> 'issuedAt')::timestamptz;
    v_source_expires_at := (v_source ->> 'expiresAt')::timestamptz;
    if v_source_issued_at > v_now
       or v_source_expires_at <= v_now
       or v_source_issued_at < v_authorization.authorized_at
       or v_source_expires_at > v_authorization.expires_at then
      return jsonb_build_object('status', 'conflict');
    end if;
  end loop;

  -- The authorization row serializes all registrations for one run.  Re-read
  -- the idempotency key after taking that lock to turn an identical concurrent
  -- request into the immutable winner rather than a false conflict.
  select manifest.*
    into v_existing
  from platform_private.ac265_hosted_artifact_manifests as manifest
  where manifest.authorization_id = v_authorization_id
    and manifest.idempotency_ref = p_request ->> 'idempotencyRef'
  for update;
  -- The manifest lock can wait behind another registration.  Refresh the
  -- wall clock and revalidate the locked authority/source windows before any
  -- idempotent envelope or conflict fallback.
  v_now := clock_timestamp();
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.authorized_at <= v_now
    and authz.expires_at > v_now
  for update;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;
  for v_source in
    select value from jsonb_array_elements(v_sources) as item(value)
  loop
    v_source_issued_at := (v_source ->> 'issuedAt')::timestamptz;
    v_source_expires_at := (v_source ->> 'expiresAt')::timestamptz;
    if v_source_issued_at > v_now
       or v_source_expires_at <= v_now
       or v_source_issued_at < v_authorization.authorized_at
       or v_source_expires_at > v_authorization.expires_at then
      return jsonb_build_object('status', 'conflict');
    end if;
  end loop;
  if v_existing.manifest_id is not null then
    if v_existing.request_sha256 <> v_request_sha256 then
      return jsonb_build_object('status', 'conflict');
    end if;
    return platform_private.ac265_build_hosted_artifact_manifest_envelope(
      v_existing.manifest_id
    );
  end if;

  if exists (
    select 1
    from platform_private.ac265_hosted_artifact_manifests as manifest
    where manifest.authorization_id = v_authorization_id
  ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  select candidate.*
    into v_candidate
  from platform_private.ac265_verified_candidates as candidate
  where candidate.identity_sha256 = v_authorization.identity_sha256
    and candidate.source_revision = v_authorization.source_revision
    and candidate.deployment_id = v_authorization.deployment_id
    and candidate.identity ->> 'environment' = 'staging'
    and candidate.identity ->> 'hostingProjectId' = 'wejammin-staging'
    and candidate.identity ->> 'supabaseProjectRef' ~ '^[a-z0-9]{20}$';
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  -- Source windows cannot outlive the server-issued authorization window.
  v_now := clock_timestamp();
  if v_authorization.authorized_at > v_now
     or v_authorization.expires_at <= v_now then
    return jsonb_build_object('status', 'conflict');
  end if;
  for v_source in
    select value from jsonb_array_elements(v_sources) as item(value)
  loop
    begin
      v_source_issued_at := (v_source ->> 'issuedAt')::timestamptz;
      v_source_expires_at := (v_source ->> 'expiresAt')::timestamptz;
    exception when others then
      raise exception 'AC265 hosted-artifact source request rejected'
        using errcode = '22023';
    end;
    if v_source_issued_at > v_now
       or v_source_expires_at <= v_now
       or v_source_issued_at < v_authorization.authorized_at
       or v_source_expires_at > v_authorization.expires_at then
      return jsonb_build_object('status', 'conflict');
    end if;
  end loop;

  v_manifest_id := extensions.gen_random_uuid();
  v_manifest_ref := 'ac265-artifact-manifest://staging/' || v_manifest_id::text;
  insert into platform_private.ac265_hosted_artifact_manifests (
    manifest_id, manifest_ref, authorization_id, candidate_id, run_id,
    identity_sha256, environment, source_revision, deployment_id,
    hosting_project_id, supabase_project_ref, source_count,
    source_set_complete, kind_complete, registered_at, idempotency_ref,
    request_sha256
  ) values (
    v_manifest_id, v_manifest_ref, v_authorization.authorization_id,
    v_candidate.candidate_id, v_authorization.run_id, v_candidate.identity_sha256,
    'staging', v_candidate.source_revision, v_candidate.deployment_id,
    v_candidate.identity ->> 'hostingProjectId',
    v_candidate.identity ->> 'supabaseProjectRef', v_source_count,
    v_source_set_complete, v_kind_complete, v_now,
    p_request ->> 'idempotencyRef',
    v_request_sha256
  );

  for v_source, v_source_ordinal in
    select value, ordinal::integer
    from jsonb_array_elements(v_sources) with ordinality as item(value, ordinal)
  loop
    v_source_issued_at := (v_source ->> 'issuedAt')::timestamptz;
    v_source_expires_at := (v_source ->> 'expiresAt')::timestamptz;
    insert into platform_private.ac265_hosted_artifact_replay_ledger (
      artifact_ref, manifest_id, authorization_id, candidate_id, run_id,
      identity_sha256, source_revision, deployment_id, hosting_project_id,
      supabase_project_ref, artifact_kind, artifact_sha256, attestation_sha256,
      attestation_key_id, subject_sha256, issued_at, expires_at, first_seen_at
    ) values (
      v_source ->> 'artifactRef', v_manifest_id,
      v_authorization.authorization_id, v_candidate.candidate_id,
      v_authorization.run_id, v_candidate.identity_sha256,
      v_candidate.source_revision, v_candidate.deployment_id,
      v_candidate.identity ->> 'hostingProjectId',
      v_candidate.identity ->> 'supabaseProjectRef', v_source ->> 'kind',
      decode(v_source ->> 'artifactSha256', 'hex'),
      decode(v_source ->> 'attestationSha256', 'hex'),
      v_source ->> 'attestationKeyId',
      decode(v_source ->> 'subjectSha256', 'hex'), v_source_issued_at,
      v_source_expires_at, v_now
    );
    insert into platform_private.ac265_hosted_artifact_manifest_sources (
      manifest_id, source_ordinal, artifact_ref, artifact_kind,
      artifact_sha256, attestation_sha256, attestation_key_id, subject_sha256,
      issued_at, expires_at
    ) values (
      v_manifest_id, v_source_ordinal, v_source ->> 'artifactRef',
      v_source ->> 'kind', decode(v_source ->> 'artifactSha256', 'hex'),
      decode(v_source ->> 'attestationSha256', 'hex'),
      v_source ->> 'attestationKeyId',
      decode(v_source ->> 'subjectSha256', 'hex'), v_source_issued_at,
      v_source_expires_at
    );
  end loop;

  return platform_private.ac265_build_hosted_artifact_manifest_envelope(
    v_manifest_id
  );
exception
  when unique_violation then
    -- A unique conflict can be a concurrent idempotent winner or a global
    -- artifact replay.  Recheck active authority and source windows before
    -- returning any fallback envelope.
    v_now := clock_timestamp();
    select authz.*
      into v_authorization
    from platform_private.ac265_runner_authorizations as authz
    where authz.authorization_id = v_authorization_id
      and authz.authorized_at <= v_now
      and authz.expires_at > v_now
    for update;
    if not found then
      return jsonb_build_object('status', 'conflict');
    end if;
    for v_source in
      select value from jsonb_array_elements(v_sources) as item(value)
    loop
      v_source_issued_at := (v_source ->> 'issuedAt')::timestamptz;
      v_source_expires_at := (v_source ->> 'expiresAt')::timestamptz;
      if v_source_issued_at > v_now
         or v_source_expires_at <= v_now
         or v_source_issued_at < v_authorization.authorized_at
         or v_source_expires_at > v_authorization.expires_at then
        return jsonb_build_object('status', 'conflict');
      end if;
    end loop;
    select manifest.*
      into v_existing
    from platform_private.ac265_hosted_artifact_manifests as manifest
    where manifest.authorization_id = v_authorization_id
      and manifest.idempotency_ref = p_request ->> 'idempotencyRef'
    for update;
    -- The fallback manifest lock may itself wait behind the winner.  Refresh
    -- authority and source windows after that lock before returning it.
    v_now := clock_timestamp();
    select authz.*
      into v_authorization
    from platform_private.ac265_runner_authorizations as authz
    where authz.authorization_id = v_authorization_id
      and authz.authorized_at <= v_now
      and authz.expires_at > v_now
    for update;
    if not found then
      return jsonb_build_object('status', 'conflict');
    end if;
    for v_source in
      select value from jsonb_array_elements(v_sources) as item(value)
    loop
      v_source_issued_at := (v_source ->> 'issuedAt')::timestamptz;
      v_source_expires_at := (v_source ->> 'expiresAt')::timestamptz;
      if v_source_issued_at > v_now
         or v_source_expires_at <= v_now
         or v_source_issued_at < v_authorization.authorized_at
         or v_source_expires_at > v_authorization.expires_at then
        return jsonb_build_object('status', 'conflict');
      end if;
    end loop;
    if v_existing.manifest_id is not null
       and v_existing.request_sha256 = v_request_sha256 then
      return platform_private.ac265_build_hosted_artifact_manifest_envelope(
        v_existing.manifest_id
      );
    end if;
    return jsonb_build_object('status', 'conflict');
end;
$function$;

revoke all on function platform_api.ac265_hosted_artifact_manifest_register(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_hosted_artifact_manifest_register(jsonb)
  to service_role;

create function platform_api.ac265_hosted_artifact_manifest_finalize(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'manifestId',
    'finalizationRef', 'manifestSha256'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_finalization_ref_pattern constant text :=
    '^ac265-finalization://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_manifest_id uuid;
  v_manifest_sha256 bytea;
  v_request_sha256 bytea;
  v_now timestamptz;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_manifest platform_private.ac265_hosted_artifact_manifests%rowtype;
  v_existing platform_private.ac265_hosted_artifact_manifest_finalizations%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'manifestId') is distinct from 'string'
     or jsonb_typeof(p_request -> 'finalizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'manifestSha256') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '')
        <> 'ac265-hosted-artifact-source-manifest-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'finalizationRef', '') !~ v_finalization_ref_pattern
     or coalesce(p_request ->> 'manifestId', '') !~ ('^' || v_uuid_pattern || '$')
     or coalesce(p_request ->> 'manifestSha256', '') !~ '^[a-f0-9]{64}$' then
    raise exception 'AC265 hosted-artifact finalization request rejected'
      using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(
      p_request ->> 'authorizationRef' from v_authorization_ref_pattern
    )::uuid;
    v_manifest_id := (p_request ->> 'manifestId')::uuid;
    v_manifest_sha256 := decode(p_request ->> 'manifestSha256', 'hex');
  exception when others then
    raise exception 'AC265 hosted-artifact finalization request rejected'
      using errcode = '22023';
  end;
  v_request_sha256 := extensions.digest(
    convert_to(p_request::text, 'utf8'), 'sha256'
  );

  -- Finalization is usable only while its server-issued authorization and all
  -- manifest source windows are active.  These checks precede idempotency.
  v_now := clock_timestamp();
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.authorized_at <= v_now
    and authz.expires_at > v_now
  for update;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  -- The authorization lock can wait behind another finalization.  Refresh the
  -- wall clock immediately after acquiring it and recheck the bound source
  -- rows before continuing toward any idempotent path.
  v_now := clock_timestamp();
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.authorized_at <= v_now
    and authz.expires_at > v_now
  for update;
  if not found
     or exists (
       select 1
       from platform_private.ac265_hosted_artifact_manifest_sources as source
       where source.manifest_id = v_manifest_id
         and (
           source.issued_at > v_now
           or source.expires_at <= v_now
           or source.issued_at < v_authorization.authorized_at
           or source.expires_at > v_authorization.expires_at
         )
     ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  select manifest.*
    into v_manifest
  from platform_private.ac265_hosted_artifact_manifests as manifest
  where manifest.manifest_id = v_manifest_id
    and manifest.authorization_id = v_authorization.authorization_id
    and manifest.run_id = v_authorization.run_id
    and manifest.identity_sha256 = v_authorization.identity_sha256
    and manifest.source_revision = v_authorization.source_revision
    and manifest.deployment_id = v_authorization.deployment_id
    and manifest.source_set_complete
    and manifest.environment = 'staging';
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  if not exists (
       select 1
       from platform_private.ac265_verified_candidates as candidate
       where candidate.candidate_id = v_manifest.candidate_id
         and candidate.identity_sha256 = v_authorization.identity_sha256
         and candidate.source_revision = v_authorization.source_revision
         and candidate.deployment_id = v_authorization.deployment_id
         and candidate.identity ->> 'environment' = 'staging'
         and candidate.identity ->> 'hostingProjectId' = v_manifest.hosting_project_id
         and candidate.identity ->> 'supabaseProjectRef' = v_manifest.supabase_project_ref
     )
     or v_manifest.source_count <> (
       select count(*)
       from platform_private.ac265_hosted_artifact_manifest_sources as source
       where source.manifest_id = v_manifest.manifest_id
     )
     or v_manifest.kind_complete is distinct from (
       exists (
         select 1
         from platform_private.ac265_hosted_artifact_manifest_sources as source
         where source.manifest_id = v_manifest.manifest_id
           and source.artifact_kind = 'server_receipt'
       )
       and exists (
         select 1
         from platform_private.ac265_hosted_artifact_manifest_sources as source
         where source.manifest_id = v_manifest.manifest_id
           and source.artifact_kind = 'execution_evidence'
       )
     )
     or exists (
       select 1
       from platform_private.ac265_hosted_artifact_manifest_sources as source
       where source.manifest_id = v_manifest.manifest_id
         and (
           source.issued_at > v_now
           or source.expires_at <= v_now
           or source.issued_at < v_authorization.authorized_at
           or source.expires_at > v_authorization.expires_at
         )
     ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  select finalization.*
    into v_existing
  from platform_private.ac265_hosted_artifact_manifest_finalizations as finalization
  where finalization.manifest_id = v_manifest_id
     or finalization.finalization_ref = p_request ->> 'finalizationRef'
     or finalization.manifest_sha256 = v_manifest_sha256
  limit 1
  for update;
  -- A finalization-row lock may wait behind a concurrent winner.  Recheck
  -- the server authorization and every source window after that lock before
  -- returning either an idempotent envelope or a conflict fallback.
  v_now := clock_timestamp();
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.authorized_at <= v_now
    and authz.expires_at > v_now
  for update;
  if not found
     or exists (
       select 1
       from platform_private.ac265_hosted_artifact_manifest_sources as source
       where source.manifest_id = v_manifest_id
         and (
           source.issued_at > v_now
           or source.expires_at <= v_now
           or source.issued_at < v_authorization.authorized_at
           or source.expires_at > v_authorization.expires_at
         )
     ) then
    return jsonb_build_object('status', 'conflict');
  end if;
  if v_existing.manifest_id is not null then
    if v_existing.manifest_id = v_manifest_id
       and v_existing.finalization_ref = p_request ->> 'finalizationRef'
       and v_existing.manifest_sha256 = v_manifest_sha256
       and v_existing.request_sha256 = v_request_sha256 then
      return platform_private.ac265_build_hosted_artifact_manifest_envelope(
        v_manifest_id
      );
    end if;
    return jsonb_build_object('status', 'conflict');
  end if;

  insert into platform_private.ac265_hosted_artifact_manifest_finalizations (
    manifest_id, authorization_id, finalization_ref, manifest_sha256,
    finalized_at, request_sha256
  ) values (
    v_manifest_id, v_authorization.authorization_id,
    p_request ->> 'finalizationRef', v_manifest_sha256, v_now,
    v_request_sha256
  );

  return platform_private.ac265_build_hosted_artifact_manifest_envelope(
    v_manifest_id
  );
exception
  when unique_violation then
    -- Recheck active authority and source windows before any idempotent
    -- fallback after a concurrent finalization or digest conflict.
    v_now := clock_timestamp();
    select authz.*
      into v_authorization
    from platform_private.ac265_runner_authorizations as authz
    where authz.authorization_id = v_authorization_id
      and authz.authorized_at <= v_now
      and authz.expires_at > v_now
    for update;
    if not found
       or exists (
         select 1
         from platform_private.ac265_hosted_artifact_manifest_sources as source
         where source.manifest_id = v_manifest_id
           and (
             source.issued_at > v_now
             or source.expires_at <= v_now
             or source.issued_at < v_authorization.authorized_at
             or source.expires_at > v_authorization.expires_at
           )
       ) then
      return jsonb_build_object('status', 'conflict');
    end if;
    select finalization.*
      into v_existing
    from platform_private.ac265_hosted_artifact_manifest_finalizations as finalization
    where finalization.manifest_id = v_manifest_id
       or finalization.finalization_ref = p_request ->> 'finalizationRef'
       or finalization.manifest_sha256 = v_manifest_sha256
    limit 1
    for update;
    -- The unique-conflict fallback can wait on the winner's finalization row;
    -- refresh authority/source windows after that blocking lock as well.
    v_now := clock_timestamp();
    select authz.*
      into v_authorization
    from platform_private.ac265_runner_authorizations as authz
    where authz.authorization_id = v_authorization_id
      and authz.authorized_at <= v_now
      and authz.expires_at > v_now
    for update;
    if not found
       or exists (
         select 1
         from platform_private.ac265_hosted_artifact_manifest_sources as source
         where source.manifest_id = v_manifest_id
           and (
             source.issued_at > v_now
             or source.expires_at <= v_now
             or source.issued_at < v_authorization.authorized_at
             or source.expires_at > v_authorization.expires_at
           )
       ) then
      return jsonb_build_object('status', 'conflict');
    end if;
    if v_existing.manifest_id is not null
       and v_existing.manifest_id = v_manifest_id
       and v_existing.finalization_ref = p_request ->> 'finalizationRef'
       and v_existing.manifest_sha256 = v_manifest_sha256
       and v_existing.request_sha256 = v_request_sha256 then
      return platform_private.ac265_build_hosted_artifact_manifest_envelope(
        v_manifest_id
      );
    end if;
    return jsonb_build_object('status', 'conflict');
end;
$function$;

revoke all on function platform_api.ac265_hosted_artifact_manifest_finalize(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_hosted_artifact_manifest_finalize(jsonb)
  to service_role;

create function platform_api.ac265_hosted_artifact_manifest_read(p_request jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_top_keys constant text[] := array[
    'criterion', 'schemaVersion', 'authorizationRef', 'manifestId'
  ];
  v_uuid_pattern constant text :=
    '[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
  v_authorization_ref_pattern constant text :=
    '^ac265-authorization://staging/(' || v_uuid_pattern || ')$';
  v_authorization_id uuid;
  v_manifest_id uuid;
  v_now timestamptz;
  v_authorization platform_private.ac265_runner_authorizations%rowtype;
  v_manifest platform_private.ac265_hosted_artifact_manifests%rowtype;
  v_finalization platform_private.ac265_hosted_artifact_manifest_finalizations%rowtype;
begin
  if p_request is null
     or jsonb_typeof(p_request) <> 'object'
     or not (p_request ?& v_top_keys)
     or (p_request - v_top_keys) <> '{}'::jsonb
     or jsonb_typeof(p_request -> 'criterion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'schemaVersion') is distinct from 'string'
     or jsonb_typeof(p_request -> 'authorizationRef') is distinct from 'string'
     or jsonb_typeof(p_request -> 'manifestId') is distinct from 'string'
     or coalesce(p_request ->> 'criterion', '') <> 'P2-S09-AC-265'
     or coalesce(p_request ->> 'schemaVersion', '')
        <> 'ac265-hosted-artifact-source-manifest-v1'
     or coalesce(p_request ->> 'authorizationRef', '') !~ v_authorization_ref_pattern
     or coalesce(p_request ->> 'manifestId', '') !~ ('^' || v_uuid_pattern || '$') then
    raise exception 'AC265 hosted-artifact manifest read request rejected'
      using errcode = '22023';
  end if;

  begin
    v_authorization_id := substring(
      p_request ->> 'authorizationRef' from v_authorization_ref_pattern
    )::uuid;
    v_manifest_id := (p_request ->> 'manifestId')::uuid;
  exception when others then
    raise exception 'AC265 hosted-artifact manifest read request rejected'
      using errcode = '22023';
  end;

  v_now := clock_timestamp();
  select authz.*
    into v_authorization
  from platform_private.ac265_runner_authorizations as authz
  where authz.authorization_id = v_authorization_id
    and authz.authorized_at <= v_now
    and authz.expires_at > v_now;
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  select manifest.*
    into v_manifest
  from platform_private.ac265_hosted_artifact_manifests as manifest
  where manifest.manifest_id = v_manifest_id
    and manifest.authorization_id = v_authorization.authorization_id
    and manifest.run_id = v_authorization.run_id
    and manifest.identity_sha256 = v_authorization.identity_sha256
    and manifest.source_revision = v_authorization.source_revision
    and manifest.deployment_id = v_authorization.deployment_id
    and manifest.source_set_complete
    and manifest.environment = 'staging';
  if not found then
    return jsonb_build_object('status', 'conflict');
  end if;

  if not exists (
       select 1
       from platform_private.ac265_verified_candidates as candidate
       where candidate.candidate_id = v_manifest.candidate_id
         and candidate.identity_sha256 = v_authorization.identity_sha256
         and candidate.source_revision = v_authorization.source_revision
         and candidate.deployment_id = v_authorization.deployment_id
         and candidate.identity ->> 'environment' = 'staging'
         and candidate.identity ->> 'hostingProjectId' = v_manifest.hosting_project_id
         and candidate.identity ->> 'supabaseProjectRef' = v_manifest.supabase_project_ref
     )
     or v_manifest.source_count <> (
       select count(*)
       from platform_private.ac265_hosted_artifact_manifest_sources as source
       where source.manifest_id = v_manifest.manifest_id
     )
     or v_manifest.kind_complete is distinct from (
       exists (
         select 1
         from platform_private.ac265_hosted_artifact_manifest_sources as source
         where source.manifest_id = v_manifest.manifest_id
           and source.artifact_kind = 'server_receipt'
       )
       and exists (
         select 1
         from platform_private.ac265_hosted_artifact_manifest_sources as source
         where source.manifest_id = v_manifest.manifest_id
           and source.artifact_kind = 'execution_evidence'
       )
     )
     or exists (
       select 1
       from platform_private.ac265_hosted_artifact_manifest_sources as source
       where source.manifest_id = v_manifest.manifest_id
         and (
           source.issued_at > v_now
           or source.expires_at <= v_now
           or source.issued_at < v_authorization.authorized_at
           or source.expires_at > v_authorization.expires_at
         )
     ) then
    return jsonb_build_object('status', 'conflict');
  end if;

  select finalization.*
    into v_finalization
  from platform_private.ac265_hosted_artifact_manifest_finalizations as finalization
  where finalization.manifest_id = v_manifest.manifest_id;
  if not found or v_finalization.manifest_sha256 is null then
    return jsonb_build_object('status', 'conflict');
  end if;

  return platform_private.ac265_build_hosted_artifact_manifest_envelope(
    v_manifest.manifest_id
  );
end;
$function$;

revoke all on function platform_api.ac265_hosted_artifact_manifest_read(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function platform_api.ac265_hosted_artifact_manifest_read(jsonb)
  to service_role;

comment on table platform_private.ac265_hosted_artifact_manifests is
  'Private immutable AC265 source-manifest bookkeeping bound to one server-issued run and candidate; source_set_complete and kind_complete do not establish AC265 acceptance or signature verification.';
comment on table platform_private.ac265_hosted_artifact_manifest_finalizations is
  'Private immutable final signed-manifest digest projection; the digest is supplied after signing and is not signature verification or raw manifest bytes.';
comment on table platform_private.ac265_hosted_artifact_manifest_sources is
  'Private immutable digest-only AC265 manifest source membership; raw bytes and keys are excluded.';
comment on table platform_private.ac265_hosted_artifact_replay_ledger is
  'Private immutable global AC265 artifact-reference replay fence.';
comment on function platform_api.ac265_hosted_artifact_manifest_register(jsonb) is
  'Registers a bounded server-bound hosted-artifact source manifest with exact idempotency; completeness fields are bookkeeping only and do not prove AC265 acceptance or signatures.';
comment on function platform_api.ac265_hosted_artifact_manifest_finalize(jsonb) is
  'Finalizes one registered source manifest with an immutable caller-supplied signed-manifest digest after signing; the database stores no raw signed bytes and does not verify the signature.';
comment on function platform_api.ac265_hosted_artifact_manifest_read(jsonb) is
  'Reads one active finalized server-bound hosted-artifact source manifest as a redacted envelope; registered-only manifests fail closed.';
