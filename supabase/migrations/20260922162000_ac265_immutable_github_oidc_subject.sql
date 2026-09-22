do $migration$
declare
  v_enroll_function regprocedure := to_regprocedure(
    'platform_api.ac265_enroll_verified_candidate(jsonb)'
  );
  v_prepare_function regprocedure := to_regprocedure(
    'platform_private.ac265_prepare_hosted_run_candidate(jsonb)'
  );
  v_enroll_definition text;
  v_prepare_definition text;
  v_legacy_repository constant text := 'WeJustJammin/nevrite-music';
  v_current_repository constant text := 'WeJustJammin/wejammin';
  v_legacy_subject constant text :=
    'repo:WeJustJammin/nevrite-music:environment:staging';
  v_immutable_subject constant text :=
    'repo:WeJustJammin@305953066/wejammin@1297208152:environment:staging';
  v_current_workflow_ref constant text :=
    'WeJustJammin/wejammin/.github/workflows/run-ac265-hosted-e2e.yml@refs/heads/main';
  v_occurrences integer;
begin
  if v_enroll_function is null or v_prepare_function is null then
    raise exception 'AC265 candidate authorization function is missing'
      using errcode = '55000';
  end if;

  v_enroll_definition := pg_get_functiondef(v_enroll_function);
  v_prepare_definition := pg_get_functiondef(v_prepare_function);

  if position(v_legacy_repository in v_enroll_definition) = 0
     and position(v_current_repository in v_enroll_definition) > 0
     and position(v_legacy_subject in v_prepare_definition) = 0
     and position(v_legacy_repository in v_prepare_definition) = 0
     and position(v_immutable_subject in v_prepare_definition) > 0
     and position(v_current_workflow_ref in v_prepare_definition) > 0 then
    return;
  end if;

  v_occurrences := (
    length(v_enroll_definition)
      - length(replace(v_enroll_definition, v_legacy_repository, ''))
  ) / length(v_legacy_repository);
  if v_occurrences <> 1
     or position(v_current_repository in v_enroll_definition) > 0 then
    raise exception 'AC265 enrollment repository definition is unexpected'
      using errcode = '55000';
  end if;

  v_occurrences := (
    length(v_prepare_definition)
      - length(replace(v_prepare_definition, v_legacy_subject, ''))
  ) / length(v_legacy_subject);
  if v_occurrences <> 1
     or position(v_immutable_subject in v_prepare_definition) > 0 then
    raise exception 'AC265 prepare-run OIDC subject definition is unexpected'
      using errcode = '55000';
  end if;

  v_prepare_definition := replace(
    v_prepare_definition,
    v_legacy_subject,
    v_immutable_subject
  );
  v_occurrences := (
    length(v_prepare_definition)
      - length(replace(v_prepare_definition, v_legacy_repository, ''))
  ) / length(v_legacy_repository);
  if v_occurrences <> 2
     or position(v_current_workflow_ref in v_prepare_definition) > 0 then
    raise exception 'AC265 prepare-run repository definition is unexpected'
      using errcode = '55000';
  end if;

  execute replace(
    v_enroll_definition,
    v_legacy_repository,
    v_current_repository
  );
  execute replace(
    v_prepare_definition,
    v_legacy_repository,
    v_current_repository
  );

  v_enroll_definition := pg_get_functiondef(v_enroll_function);
  v_prepare_definition := pg_get_functiondef(v_prepare_function);
  if position(v_legacy_repository in v_enroll_definition) > 0
     or position(v_current_repository in v_enroll_definition) = 0
     or position(v_legacy_subject in v_prepare_definition) > 0
     or position(v_legacy_repository in v_prepare_definition) > 0
     or position(v_immutable_subject in v_prepare_definition) = 0
     or position(v_current_workflow_ref in v_prepare_definition) = 0 then
    raise exception 'AC265 immutable GitHub identity replacement failed'
      using errcode = '55000';
  end if;
end;
$migration$;

-- Rollback requires a new forward migration restoring the previous repository
-- identity only after GitHub has reversed the repository rename and immutable
-- OIDC subject configuration.
