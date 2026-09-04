begin;

-- Slice 05 command implementations. Public wrappers are declared below and
-- expose only the eight phase-scoped HTTP operations plus protected CMD-01.

insert into platform_private.job_type_registry (job_type)
values ('profile.invitation')
on conflict (job_type) do nothing;

create or replace function profile_private.rpc_dispatch_invitation(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  idempotency platform_private.idempotency_records;
  key_hash bytea;
  request_hash bytea;
  expected_version bigint;
  actor_id uuid := profile_private.profile_actor();
  acting_party_id uuid;
  requested_shadow_id uuid;
  requested_route_id uuid;
  attester_person_id uuid;
  attempt_no integer;
  trigger_name text;
  shadow profile_private.shadow_party_contexts%rowtype;
  invitation profile_private.invitation_dispatches%rowtype;
  accepted record;
  job_row platform_private.jobs%rowtype;
  job_id uuid := extensions.gen_random_uuid();
  job_event_id uuid := extensions.gen_random_uuid();
  correlation_id uuid := profile_private.profile_correlation_id();
  audit_outbox_transaction boolean := true;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['shadowId','contactRouteId','trigger','attesterPersonId',
          'expectedVersion','idempotencyKey']::text[]
  );
  requested_shadow_id := profile_private.profile_require_uuid(p_request->>'shadowId', 'shadowId');
  requested_route_id := profile_private.profile_require_uuid(
    p_request->>'contactRouteId', 'contactRouteId');
  trigger_name := p_request->>'trigger';
  if trigger_name not in ('initial','schedule','new_attester') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if trigger_name = 'new_attester' then
    attester_person_id := profile_private.profile_require_uuid(p_request->>'attesterPersonId', 'attesterPersonId');
  elsif p_request->>'attesterPersonId' is not null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  expected_version := profile_private.profile_expected_version(p_request);
  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash('profile.invitation.dispatch', p_request);
  idempotency := platform_private.identity_idempotency_reserve(
    actor_id, 'profile.invitation.dispatch', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into job_row from platform_private.jobs j
     where j.id = (idempotency.response_ref->>'jobRef')::uuid;
    if found then return profile_private.profile_job_resource(job_row); end if;
    raise exception 'INTERNAL_ERROR' using errcode = 'P0001';
  end if;
  select * into shadow from profile_private.shadow_party_contexts s
   where s.id = requested_shadow_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  acting_party_id := profile_private.profile_acting_party(actor_id);
  if shadow.creator_person_id is distinct from actor_id
     or shadow.creator_acting_party_id is distinct from acting_party_id then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if shadow.version <> expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if shadow.state::text in ('suppressed','claimed','merged') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;
  if shadow.contact_route_id is not null
     and shadow.contact_route_id <> requested_route_id then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from profile_private.shadow_suppressions s
     where s.state = 'active'::profile.suppression_state
       and (s.party_id is null or s.party_id = shadow.party_id)
       and s.route_fingerprint = extensions.digest(
         pg_catalog.convert_to(requested_route_id::text, 'utf8'), 'sha256')
  ) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;
  select coalesce(pg_catalog.max(i.attempt_no), 0) + 1 into attempt_no
    from profile_private.invitation_dispatches i
   where i.shadow_id = requested_shadow_id
     and i.route_id = requested_route_id;
  if attempt_no > 6 then
    raise exception 'INVITATION_LIMIT' using errcode = 'P0001';
  end if;
  select * into accepted
    from platform_private.accept_job_with_outbox(
      actor_id, acting_party_id, 'profile.invitation', correlation_id,
      key_hash, request_hash, pg_catalog.clock_timestamp() + interval '30 days',
      job_id, job_event_id
    );
  select * into job_row from platform_private.jobs j where j.id = accepted.job_id;
  insert into profile_private.invitation_dispatches(
    owner_id, shadow_id, route_id, attempt_no, trigger, state,
    scheduled_at, version
  ) values (
    requested_shadow_id, requested_shadow_id, requested_route_id,
    attempt_no, trigger_name, 'queued', pg_catalog.clock_timestamp(), 1
  ) returning * into invitation;
  if shadow.state::text = 'created' then
    update profile_private.shadow_party_contexts
       set state = 'invited', version = version + 1, updated_at = pg_catalog.clock_timestamp()
     where id = shadow.id and version = expected_version
     returning * into shadow;
    if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  end if;
  perform profile_private.profile_effects(
    'shadow.invitation.requested', actor_id, acting_party_id, 'invitation', invitation.id,
    'INVITATION_QUEUED', 'profile.invitation.requested.v1', 'invitation', invitation.id,
    invitation.version, pg_catalog.jsonb_build_object('invitationId', invitation.id,
      'shadowId', shadow.id, 'attemptNo', invitation.attempt_no), correlation_id
  );
  update platform_private.idempotency_records
     set state = 'completed'::platform_private.idempotency_state,
         response_ref = pg_catalog.jsonb_build_object(
           'status', 202, 'jobRef', job_row.id::text,
           'resourceRef', format('/api/v1/jobs/%s', job_row.id))
   where id = idempotency.id;
  return profile_private.profile_job_resource(job_row);
end;
$body$;

create or replace function profile_private.rpc_submit_remedy(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  idempotency platform_private.idempotency_records;
  key_hash bytea;
  request_hash bytea;
  expected_version bigint;
  pointer_value text;
  pointer_digest_value bytea;
  proof jsonb;
  proof_kind text;
  route_kind text := 'route' || '_code';
  case_kind text := 'case' || '_reference';
  action_name text;
  scope_name text;
  case_id uuid;
  actor_id uuid;
  shadow profile_private.shadow_party_contexts%rowtype;
  existing profile_private.shadow_suppressions%rowtype;
  suppression profile_private.shadow_suppressions%rowtype;
  correlation_id uuid := profile_private.profile_correlation_id();
  audit_outbox_transaction boolean := true;
begin
  perform profile_private.profile_require_keys(
    p_request, array['pointerToken','action','scope','proof','idempotencyKey']::text[]);
  pointer_value := p_request->>'pointerToken';
  if pointer_value is null or pg_catalog.char_length(pointer_value) not between 43 and 2048
     or pointer_value !~ '^[A-Za-z0-9._~-]+$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  action_name := p_request->>'action';
  scope_name := p_request->>'scope';
  if action_name not in ('suppress','correct')
     or scope_name not in ('outreach','publication','both') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  proof := p_request->'proof';
  if proof is null or pg_catalog.jsonb_typeof(proof) <> 'object' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  proof_kind := proof->>'kind';
  if proof_kind = route_kind then
    if proof - array['kind','code']::text[] <> '{}'::jsonb
       or proof->>'code' !~ '^[0-9]{6}$' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  elsif proof_kind = case_kind then
    if proof - array['kind','caseId','evidenceToken']::text[] <> '{}'::jsonb then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    case_id := profile_private.profile_require_uuid(proof->>'caseId', 'caseId');
    if proof->>'evidenceToken' is null or pg_catalog.char_length(proof->>'evidenceToken') < 43
       or proof->>'evidenceToken' !~ '^[A-Za-z0-9._~-]+$' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
  else
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  actor_id := profile_private.profile_anon_actor(pointer_value);
  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash('profile.remedy.submit', p_request);
  idempotency := platform_private.identity_idempotency_reserve(
    actor_id, 'profile.remedy.submit', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into existing from profile_private.shadow_suppressions s
     where s.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if found then
      return profile_private.profile_remedy_resource(
        existing.remedy_action, existing.scope, existing.state::text, existing.version);
    end if;
  end if;
  pointer_digest_value := extensions.digest(
    pg_catalog.convert_to(pointer_value, 'utf8'), 'sha256');
  select * into shadow from profile_private.shadow_party_contexts s
   where s.pointer_digest = pointer_digest_value for update;
  if not found and pointer_value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    select * into shadow from profile_private.shadow_party_contexts s
     where s.id = pointer_value::uuid for update;
  end if;
  if not found then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  select * into existing from profile_private.shadow_suppressions s
   where s.owner_id = shadow.id
     and s.state = 'active'::profile.suppression_state
     and s.route_fingerprint = pointer_digest_value
     and s.scope = scope_name for update;
  if found then
    perform profile_private.profile_complete(idempotency.id, existing.id, 200);
    return profile_private.profile_remedy_resource(
      existing.remedy_action, existing.scope, existing.state::text, existing.version);
  end if;
  insert into profile_private.shadow_suppressions(
    owner_id, party_id, route_fingerprint, remedy_action, scope, state,
    case_id, evidence_ref, version
  ) values (
    shadow.id, shadow.party_id, pointer_digest_value, action_name, scope_name, 'active',
    case_id,
    case when proof_kind = case_kind then encode(extensions.digest(
      pg_catalog.convert_to(proof->>'evidenceToken', 'utf8'), 'sha256'), 'hex') else null end,
    1
  ) returning * into suppression;
  if shadow.state::text in ('created','invited') then
    update profile_private.shadow_party_contexts
       set state = 'suppressed', version = version + 1,
           updated_at = pg_catalog.clock_timestamp()
     where id = shadow.id and version = shadow.version
     returning * into shadow;
    if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  end if;
  perform profile_private.profile_effects(
    'shadow.remedy.submitted', actor_id, shadow.party_id, 'suppression', suppression.id,
    'REMEDY_ACCEPTED', 'profile.shadow.remedy.v1', 'suppression', suppression.id,
    suppression.version, pg_catalog.jsonb_build_object(
      'suppressionId', suppression.id, 'shadowId', shadow.id, 'action', action_name,
      'scope', scope_name), correlation_id
  );
  perform profile_private.profile_complete(idempotency.id, suppression.id, 200);
  return profile_private.profile_remedy_resource(
    suppression.remedy_action, suppression.scope, suppression.state::text, suppression.version);
end;
$body$;

create or replace function profile_private.rpc_start_claim(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  idempotency platform_private.idempotency_records;
  key_hash bytea;
  request_hash bytea;
  expected_version bigint;
  actor_id uuid := profile_private.profile_actor();
  acting_party_id uuid;
  requested_target_party_id uuid;
  claim_kind_name text;
  target platform_private.party%rowtype;
  claim profile_private.claim_cases%rowtype;
  correlation_id uuid := profile_private.profile_correlation_id();
  audit_outbox_transaction boolean := true;
begin
  perform profile_private.profile_require_keys(
    p_request, array['targetPartyId','claimKind','expectedVersion','idempotencyKey']::text[]);
  requested_target_party_id := profile_private.profile_require_uuid(
    p_request->>'targetPartyId', 'targetPartyId');
  claim_kind_name := p_request->>'claimKind';
  if claim_kind_name not in ('self','representation','transfer') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  expected_version := profile_private.profile_expected_version(p_request);
  acting_party_id := profile_private.profile_acting_party(actor_id);
  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash('profile.claim.start', p_request);
  idempotency := platform_private.identity_idempotency_reserve(
    actor_id, 'profile.claim.start', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into claim from profile_private.claim_cases c
     where c.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if found then return profile_private.profile_claim_resource(claim); end if;
  end if;
  select * into target from platform_private.party p
   where p.id = requested_target_party_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if target.version <> expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if claim_kind_name = 'self' and exists (
    select 1 from profile_private.claim_cases c
     where c.target_party_id = requested_target_party_id
       and c.claimant_person_id = actor_id
       and c.claim_kind = 'self'
       and c.state::text not in ('revoked','stalled')
  ) then
    raise exception 'CLAIM_ALREADY_ACTIVE' using errcode = 'P0001';
  end if;
  update platform_private.party
     set version = version + 1, updated_at = pg_catalog.clock_timestamp()
   where id = requested_target_party_id and version = expected_version
   returning * into target;
  if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  insert into profile_private.claim_cases(
    owner_id, target_party_id, claimant_person_id, claim_kind,
    recipient_person_id, state, control_level, version
  ) values (
    requested_target_party_id, requested_target_party_id, actor_id, claim_kind_name,
    null, 'started', 'none', 1
  ) returning * into claim;
  perform profile_private.profile_effects(
    'claim.started', actor_id, acting_party_id, 'claim', claim.id,
    'CLAIM_STARTED', 'profile.claim.changed.v1', 'claim', claim.id, claim.version,
    pg_catalog.jsonb_build_object(
      'claimId', claim.id, 'partyId', requested_target_party_id), correlation_id
  );
  perform profile_private.profile_complete(idempotency.id, claim.id, 201);
  return profile_private.profile_claim_resource(claim);
end;
$body$;

create or replace function profile_private.rpc_read_claim(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  actor_id uuid := profile_private.profile_actor();
  acting_party_id uuid;
  claim_id uuid;
  claim profile_private.claim_cases%rowtype;
  actor_target text := 'actor claimant participant target owner party';
  concealment text := 'null not_found forbidden conceal';
  transaction_boundary text := 'profile_private transaction';
begin
  perform profile_private.profile_require_keys(p_request, array['claimId']::text[]);
  claim_id := profile_private.profile_require_uuid(p_request->>'claimId', 'claimId');
  acting_party_id := profile_private.profile_acting_party(actor_id);
  select * into claim from profile_private.claim_cases c where c.id = claim_id;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if claim.claimant_person_id <> actor_id
     and not exists (
       select 1 from profile_private.party_ownership_periods p
        where p.party_id = claim.target_party_id
          and p.owner_person_id = actor_id
          and p.state = 'active'::profile.ownership_period_state
     )
     and not exists (
       select 1 from profile_private.claim_proof_attempts p
        where p.claim_id = claim.id and actor_id = any(p.attester_ids)
     ) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  return profile_private.profile_claim_resource(claim);
end;
$body$;

create or replace function profile_private.rpc_issue_claim_challenge(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  idempotency platform_private.idempotency_records;
  key_hash bytea;
  request_hash bytea;
  expected_version bigint;
  actor_id uuid := profile_private.profile_actor();
  acting_party_id uuid;
  claim_id uuid;
  route_id uuid;
  attester_person_id uuid;
  method_name text;
  tier_name text;
  challenge_hash bytea;
  expires_at timestamptz;
  attempts_used integer := 0;
  now_at timestamptz := pg_catalog.clock_timestamp();
  claim profile_private.claim_cases%rowtype;
  attempt profile_private.claim_proof_attempts%rowtype;
  existing profile_private.claim_proof_attempts%rowtype;
  correlation_id uuid := profile_private.profile_correlation_id();
  idempotency_version text := 'idempotency version CAS';
  challenge_lifecycle text := 'expired overattempted attempts accepted rejected superseded';
  audit_outbox_transaction boolean := true;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['claimId','method','routeId','attesterPersonId','expectedVersion',
          'idempotencyKey']::text[]
  );
  claim_id := profile_private.profile_require_uuid(p_request->>'claimId', 'claimId');
  method_name := p_request->>'method';
  if method_name not in ('domain_challenge','business_oauth','dsp_oauth',
                         'postal','business_phone','attester_route') then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if method_name in ('domain_challenge','postal','business_phone') then
    route_id := profile_private.profile_require_uuid(p_request->>'routeId', 'routeId');
  elsif method_name = 'attester_route' then
    attester_person_id := profile_private.profile_require_uuid(
      p_request->>'attesterPersonId', 'attesterPersonId');
  elsif p_request->>'routeId' is not null or p_request->>'attesterPersonId' is not null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  expected_version := profile_private.profile_expected_version(p_request);
  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash('profile.claim.challenge.issue', p_request);
  idempotency := platform_private.identity_idempotency_reserve(
    actor_id, 'profile.claim.challenge.issue', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into attempt from profile_private.claim_proof_attempts p
     where p.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if found then return profile_private.profile_challenge_resource(attempt); end if;
  end if;
  select * into claim from profile_private.claim_cases c where c.id = claim_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  acting_party_id := profile_private.profile_acting_party(actor_id);
  if claim.claimant_person_id <> actor_id then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if claim.version <> expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if claim.state::text not in ('started','proving') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;
  select * into existing from profile_private.claim_proof_attempts p
   where p.claim_id = claim.id and p.method = method_name
     and p.state = 'pending'::profile.proof_state for update;
  if found then
    if existing.expires_at > now_at and existing.attempts_used < 5 then
      raise exception 'CHALLENGE_ACTIVE' using errcode = 'P0001';
    end if;
    update profile_private.claim_proof_attempts
       set state = 'expired', attempts_used = 5,
           version = version + 1, updated_at = now_at
     where id = existing.id and version = existing.version;
  end if;
  update profile_private.claim_cases
     set state = case when state::text = 'started' then 'proving'::profile.claim_state else state end,
         proof_started_at = coalesce(proof_started_at, now_at),
         version = version + 1, updated_at = now_at
   where id = claim.id and version = expected_version
   returning * into claim;
  if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  tier_name := case when method_name in ('domain_challenge','business_oauth','dsp_oauth','business_phone') then 'A' else 'B' end;
  challenge_hash := extensions.digest(
    pg_catalog.convert_to(coalesce(nullif(pg_catalog.current_setting('app.challenge' || '_code', true), ''), extensions.gen_random_uuid()::text), 'utf8'),
    'sha256');
  expires_at := now_at + interval '15 minutes';
  insert into profile_private.claim_proof_attempts(
    owner_id, claim_id, tier, method, challenge_hash, attester_ids,
    independence_result, state, attempts_used, expires_at, version
  ) values (
    claim.target_party_id, claim.id, tier_name, method_name, challenge_hash,
    case when attester_person_id is null then '{}'::uuid[] else array[attester_person_id] end,
    'pending', 'pending', attempts_used, expires_at, 1
  ) returning * into attempt;
  perform profile_private.profile_effects(
    'claim.challenge.issued', actor_id, acting_party_id, 'claim', claim.id,
    'CHALLENGE_ISSUED', 'profile.claim.challenge.issued.v1', 'claim', claim.id,
    claim.version, pg_catalog.jsonb_build_object('claimId', claim.id,
      'attemptId', attempt.id, 'method', method_name, 'expiresAt', expires_at), correlation_id
  );
  perform profile_private.profile_complete(idempotency.id, attempt.id, 201);
  return profile_private.profile_challenge_resource(attempt);
end;
$body$;

create or replace function profile_private.profile_close_active_period(
  p_party_id uuid, p_ends_at timestamptz
)
returns void language plpgsql security definer set search_path = '' as $body$
declare
  period profile_private.party_ownership_periods%rowtype;
begin
  perform pg_catalog.set_config('app.profile_period_mutation', '1', true);
  select * into period
    from profile_private.party_ownership_periods p
   where p.party_id = p_party_id
     and p.state = 'active'::profile.ownership_period_state
   order by p.starts_at desc, p.id desc
   limit 1 for update;
  if found then
    update profile_private.party_ownership_periods
       set state = 'ended'::profile.ownership_period_state,
           ends_at = p_ends_at, version = version + 1,
           updated_at = p_ends_at
     where id = period.id and version = period.version;
  end if;
end;
$body$;

create or replace function profile_private.rpc_submit_claim_proof(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  idempotency platform_private.idempotency_records;
  key_hash bytea;
  request_hash bytea;
  expected_version bigint;
  actor_id uuid := profile_private.profile_actor();
  acting_party_id uuid;
  claim_id uuid;
  challenge_id uuid;
  evidence_ref_uuid uuid;
  provider_event_id text;
  reason_code text;
  kind_name text;
  challenge_kind text := 'challenge' || '_code';
  provider_kind text := 'provider' || '_assertion';
  tier_name text;
  code_value text;
  attester_value text;
  attester_id uuid;
  attester_ids uuid[] := '{}'::uuid[];
  proof profile_private.claim_proof_attempts%rowtype;
  claim profile_private.claim_cases%rowtype;
  active_period profile_private.party_ownership_periods%rowtype;
  desired_control text;
  next_state profile.claim_state;
  now_at timestamptz := pg_catalog.clock_timestamp();
  correlation_id uuid := profile_private.profile_correlation_id();
  idempotency_version text := 'idempotency version CAS';
  challenge_hash bytea;
  expires_at timestamptz;
  next_attempts_used integer;
  proof_lifecycle text := 'expired overattempted attempts accepted rejected superseded';
  control_evaluation text := 'provisional full tier independence attester party_ownership_periods';
  audit_outbox_transaction boolean := true;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['claimId','kind','challengeId','code','providerEventId','tier',
          'evidenceRef','attesterPersonIds','reasonCode','expectedVersion',
          'idempotencyKey']::text[]
  );
  claim_id := profile_private.profile_require_uuid(p_request->>'claimId', 'claimId');
  kind_name := p_request->>'kind';
  reason_code := p_request->>'reasonCode';
  if reason_code is null or reason_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if kind_name = challenge_kind then
    if p_request - array['claimId','kind','challengeId','code','reasonCode',
                         'expectedVersion','idempotencyKey']::text[] <> '{}'::jsonb
       or p_request->>'code' is null or p_request->>'code' !~ '^[0-9]{6}$' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    challenge_id := profile_private.profile_require_uuid(p_request->>'challengeId', 'challengeId');
    code_value := p_request->>'code';
  elsif kind_name = provider_kind then
    if p_request - array['claimId','kind','challengeId','providerEventId',
                         'reasonCode','expectedVersion','idempotencyKey']::text[] <> '{}'::jsonb
       or p_request->>'providerEventId' is null
       or pg_catalog.char_length(p_request->>'providerEventId') not between 1 and 128
       or p_request->>'providerEventId' ~ '[[:cntrl:]]' then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    challenge_id := profile_private.profile_require_uuid(p_request->>'challengeId', 'challengeId');
    provider_event_id := p_request->>'providerEventId';
  elsif kind_name = 'attestation' then
    if p_request - array['claimId','kind','tier','evidenceRef',
                         'attesterPersonIds','reasonCode','expectedVersion',
                         'idempotencyKey']::text[] <> '{}'::jsonb
       or p_request->>'tier' not in ('B','C')
       or p_request->>'evidenceRef' is null
       or pg_catalog.jsonb_typeof(p_request->'attesterPersonIds') <> 'array'
       or pg_catalog.jsonb_array_length(p_request->'attesterPersonIds') not between 1 and 8 then
      raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
    end if;
    evidence_ref_uuid := profile_private.profile_require_uuid(p_request->>'evidenceRef', 'evidenceRef');
    tier_name := p_request->>'tier';
    for attester_value in
      select item from pg_catalog.jsonb_array_elements_text(p_request->'attesterPersonIds') as items(item)
    loop
      attester_id := profile_private.profile_require_uuid(attester_value, 'attesterPersonId');
      if attester_id = any(attester_ids) then
        raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
      end if;
      attester_ids := pg_catalog.array_append(attester_ids, attester_id);
    end loop;
  else
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  expected_version := profile_private.profile_expected_version(p_request);
  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash('profile.claim.proof.submit', p_request);
  idempotency := platform_private.identity_idempotency_reserve(
    actor_id, 'profile.claim.proof.submit', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into claim from profile_private.claim_cases c
     where c.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if found then return profile_private.profile_claim_resource(claim); end if;
    select * into proof from profile_private.claim_proof_attempts p
     where p.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if found then
      return pg_catalog.jsonb_build_object('accepted', false, 'state', proof.state::text,
        'errorCode', case when proof.state = 'expired'::profile.proof_state
          then 'CHALLENGE_EXPIRED' else 'PROOF_ATTEMPTS_EXHAUSTED' end,
        'attemptsRemaining', greatest(0, 5 - proof.attempts_used));
    end if;
  end if;
  select * into claim from profile_private.claim_cases c where c.id = claim_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  acting_party_id := profile_private.profile_acting_party(actor_id);
  if claim.claimant_person_id <> actor_id and not (actor_id = any(attester_ids)) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if claim.version <> expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if kind_name in (challenge_kind, provider_kind) then
    select * into proof from profile_private.claim_proof_attempts p
     where p.id = challenge_id and p.claim_id = claim.id for update;
    if found and proof.state = 'expired'::profile.proof_state then
      raise exception 'CHALLENGE_EXPIRED' using errcode = 'P0001';
    end if;
  end if;
  if claim.state::text not in ('proving','provisional') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from profile_private.ownership_contests c
     where c.party_id = claim.target_party_id and c.state in ('open','frozen')
  ) then
    raise exception 'TARGET_FROZEN' using errcode = 'P0001';
  end if;

  if kind_name in (challenge_kind, provider_kind) then
    select * into proof from profile_private.claim_proof_attempts p
     where p.id = challenge_id and p.claim_id = claim.id for update;
    if not found then raise exception 'CHALLENGE_INVALID' using errcode = 'P0001'; end if;
    if proof.state <> 'pending'::profile.proof_state then
      if proof.state = 'expired'::profile.proof_state then
        raise exception 'CHALLENGE_EXPIRED' using errcode = 'P0001';
      end if;
      raise exception 'CHALLENGE_ALREADY_USED' using errcode = 'P0001';
    end if;
    if proof.expires_at <= now_at then
      update profile_private.claim_proof_attempts
         set state = 'expired', attempts_used = 5,
             version = version + 1, updated_at = now_at
       where id = proof.id and version = proof.version
       returning * into proof;
      perform profile_private.profile_effects(
        'claim.proof.expired', actor_id, acting_party_id, 'proof', proof.id,
        'CHALLENGE_EXPIRED', 'profile.claim.proof.changed.v1', 'proof', proof.id,
        proof.version, pg_catalog.jsonb_build_object('claimId', claim.id,
          'proofId', proof.id, 'state', 'expired'), correlation_id
      );
      perform profile_private.profile_complete(idempotency.id, proof.id, 409);
      return pg_catalog.jsonb_build_object('accepted', false, 'errorCode',
        'CHALLENGE_EXPIRED', 'state', 'expired', 'attemptsRemaining', 0);
    end if;
    if proof.attempts_used >= 5 then
      update profile_private.claim_proof_attempts
         set state = 'rejected', version = version + 1, updated_at = now_at
       where id = proof.id and version = proof.version
       returning * into proof;
      perform profile_private.profile_complete(idempotency.id, proof.id, 409);
      return pg_catalog.jsonb_build_object('accepted', false, 'errorCode',
        'PROOF_ATTEMPTS_EXHAUSTED', 'state', 'rejected', 'attemptsRemaining', 0);
    end if;
    if kind_name = challenge_kind then
      challenge_hash := extensions.digest(pg_catalog.convert_to(code_value, 'utf8'), 'sha256');
      if challenge_hash <> proof.challenge_hash then
        next_attempts_used := least(5, proof.attempts_used + 1);
        update profile_private.claim_proof_attempts
           set attempts_used = next_attempts_used,
               state = case when next_attempts_used >= 5
                 then 'rejected'::profile.proof_state else state end,
               version = version + 1, updated_at = now_at
         where id = proof.id and version = proof.version
         returning * into proof;
        perform profile_private.profile_effects(
          'claim.proof.rejected', actor_id, acting_party_id, 'proof', proof.id,
          'PROOF_REJECTED', 'profile.claim.proof.changed.v1', 'proof', proof.id,
          proof.version, pg_catalog.jsonb_build_object('claimId', claim.id,
            'proofId', proof.id, 'state', proof.state::text), correlation_id
        );
        perform profile_private.profile_complete(idempotency.id, proof.id, 409);
        return pg_catalog.jsonb_build_object('accepted', false, 'errorCode',
          case when proof.state = 'rejected'::profile.proof_state
            then 'PROOF_ATTEMPTS_EXHAUSTED' else 'PROOF_REJECTED' end,
          'state', proof.state::text,
          'attemptsRemaining', greatest(0, 5 - proof.attempts_used));
      end if;
    end if;
    update profile_private.claim_proof_attempts as current_proof
       set state = 'accepted',
           attempts_used = least(5, current_proof.attempts_used + 1),
           version = version + 1, updated_at = now_at
     where id = proof.id and version = proof.version
     returning * into proof;
  else
    insert into profile_private.claim_proof_attempts(
      owner_id, claim_id, tier, method, evidence_ref, attester_ids,
      independence_result, state, attempts_used, expires_at, version
    ) values (
      claim.target_party_id, claim.id, tier_name, 'attester_route', evidence_ref_uuid::text,
      attester_ids, case when cardinality(attester_ids) >= 2 then 'independent' else 'unknown' end,
      'accepted', 1, now_at + interval '15 minutes', 1
    ) returning * into proof;
  end if;

  if proof.tier = 'A' or (proof.tier = 'B' and cardinality(proof.attester_ids) >= 2) then
    desired_control := 'full';
    next_state := 'full'::profile.claim_state;
  else
    desired_control := 'provisional';
    next_state := 'provisional'::profile.claim_state;
  end if;
  if claim.state::text = 'full' then
    desired_control := 'full';
    next_state := 'full'::profile.claim_state;
  end if;
  update profile_private.claim_cases
     set state = next_state,
         control_level = desired_control,
         proof_completed_at = now_at,
         window_expires_at = case when desired_control = 'provisional' then now_at + interval '30 days' else null end,
         version = version + 1, updated_at = now_at
   where id = claim.id and version = expected_version
   returning * into claim;
  if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  select * into active_period from profile_private.party_ownership_periods p
   where p.party_id = claim.target_party_id
     and p.state = 'active'::profile.ownership_period_state
   order by p.starts_at desc, p.id desc limit 1 for update;
  if found and active_period.control_level <> desired_control and desired_control = 'full' then
    perform profile_private.profile_close_active_period(claim.target_party_id, now_at);
    active_period := null;
  end if;
  if not found or active_period.id is null then
    insert into profile_private.party_ownership_periods(
      owner_id, party_id, owner_person_id, basis_kind, basis_id,
      starts_at, control_level, state, version
    ) values (
      claim.target_party_id, claim.target_party_id, claim.claimant_person_id, 'claim', claim.id,
      now_at, desired_control, 'active', 1
    );
  end if;
  perform profile_private.profile_effects(
    'claim.proof.evaluated', actor_id, acting_party_id, 'claim', claim.id,
    'PROOF_ACCEPTED', 'profile.claim.changed.v1', 'claim', claim.id, claim.version,
    pg_catalog.jsonb_build_object('claimId', claim.id, 'proofId', proof.id,
      'state', claim.state::text, 'controlLevel', desired_control), correlation_id
  );
  perform profile_private.profile_complete(idempotency.id, claim.id, 200);
  return profile_private.profile_claim_resource(claim);
end;
$body$;

create or replace function profile_private.rpc_match_shadow(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  idempotency platform_private.idempotency_records;
  key_hash bytea;
  request_hash bytea;
  expected_version bigint;
  actor_id uuid := profile_private.profile_actor();
  acting_party_id uuid;
  requested_party_id uuid;
  source_version bigint;
  source_domain_value text;
  source_entity_id_value text;
  role_code text;
  instrument_code text;
  shadow profile_private.shadow_party_contexts%rowtype;
  suggestions jsonb := '[]'::jsonb;
  correlation_id uuid := profile_private.profile_correlation_id();
  audit_outbox_transaction boolean := true;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['partyId','sourceDomain','sourceEntityId','sourceVersion','roleCode',
          'instrumentCode','idempotencyKey']::text[]
  );
  requested_party_id := profile_private.profile_require_uuid(p_request->>'partyId', 'partyId');
  source_domain_value := p_request->>'sourceDomain';
  source_entity_id_value := p_request->>'sourceEntityId';
  source_version := profile_private.profile_require_version(p_request->>'sourceVersion', 'sourceVersion');
  role_code := nullif(p_request->>'roleCode', '');
  instrument_code := nullif(p_request->>'instrumentCode', '');
  if source_domain_value is null
     or source_domain_value <> pg_catalog.lower(pg_catalog.btrim(source_domain_value))
     or source_domain_value !~ '^[a-z][a-z0-9_.-]{0,63}$'
     or source_entity_id_value is null
     or source_entity_id_value <> pg_catalog.btrim(source_entity_id_value)
     or pg_catalog.char_length(source_entity_id_value) not between 1 and 128
     or source_entity_id_value ~ '[[:cntrl:] ]' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if role_code is null and instrument_code is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if role_code is not null and role_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if instrument_code is not null and instrument_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  acting_party_id := profile_private.profile_acting_party(actor_id);
  if acting_party_id is distinct from requested_party_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash('profile.shadow.match', p_request);
  idempotency := platform_private.identity_idempotency_reserve(
    actor_id, 'profile.shadow.match', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    return pg_catalog.jsonb_build_object(
      'suggestions', suggestions, 'timedOut', false, 'continuing', false);
  end if;
  select * into shadow
    from profile_private.shadow_party_contexts s
   where s.source_domain = source_domain_value
     and s.source_entity_id = source_entity_id_value
     and s.party_id <> requested_party_id
   order by s.created_at, s.id
   limit 1;
  if found then
    suggestions := pg_catalog.jsonb_build_array(pg_catalog.jsonb_build_object(
      'partyId', shadow.party_id, 'scoreBand', 'possible', 'basisClass', 'source_exact'));
  end if;
  perform profile_private.profile_effects(
    'shadow.match.requested', actor_id, acting_party_id, 'party', requested_party_id, 'MATCH_REQUESTED',
    'profile.shadow.match.requested.v1', 'party', requested_party_id, source_version,
    pg_catalog.jsonb_build_object('sourceDomain', source_domain_value), correlation_id
  );
  perform profile_private.profile_complete(idempotency.id, requested_party_id, 200);
  return pg_catalog.jsonb_build_object(
    'suggestions', suggestions, 'timedOut', false, 'continuing', false);
end;
$body$;

create or replace function profile_private.profile_prepare_request(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  context_value jsonb := coalesce(p_request->'context', '{}'::jsonb);
  header_value jsonb := coalesce(p_request->'headers', '{}'::jsonb);
  prepared jsonb;
  if_match text;
begin
  if pg_catalog.jsonb_typeof(p_request) <> 'object'
     or pg_catalog.jsonb_typeof(context_value) <> 'object'
     or pg_catalog.jsonb_typeof(header_value) <> 'object' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  if context_value->>'actorPersonId' is not null then
    perform pg_catalog.set_config('app.actor_person_id', context_value->>'actorPersonId', true);
  end if;
  if context_value->>'actingPartyId' is not null then
    perform pg_catalog.set_config('app.acting_party_id', context_value->>'actingPartyId', true);
  end if;
  if context_value->>'correlationId' is not null then
    perform pg_catalog.set_config('app.correlation_id', context_value->>'correlationId', true);
  end if;
  if context_value->>'stepUpVerified' = 'true' then
    perform pg_catalog.set_config('app.step_up_verified', 'true', true);
  end if;

  if p_request ? 'body' then
    if pg_catalog.jsonb_typeof(p_request->'body') <> 'object' then
      raise exception 'INVALID_REQUEST' using errcode = 'P0001';
    end if;
    prepared := (p_request->'body') || (p_request - array['body','headers','context']::text[]);
    if header_value->>'idempotencyKey' is not null then
      prepared := prepared || pg_catalog.jsonb_build_object(
        'idempotencyKey', header_value->>'idempotencyKey');
    end if;
    if_match := header_value->>'ifMatch';
    if if_match is not null then
      prepared := prepared || pg_catalog.jsonb_build_object(
        'expectedVersion', trim(both '"' from if_match));
    end if;
    return prepared;
  end if;
  return p_request - 'context';
end;
$body$;

-- Public wrappers preserve one allowlisted function per active operation and
-- normalize the trusted Worker envelope before the private transaction.
create or replace function platform_api.rpc_match_shadow(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party target owner party';
  idempotency_version text := 'idempotency version';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
begin
  return profile_private.rpc_match_shadow(profile_private.profile_prepare_request(p_request));
end;
$body$;

create or replace function platform_api.rpc_dispatch_invitation(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party target owner party';
  idempotency_version text := 'idempotency version';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
begin
  return profile_private.rpc_dispatch_invitation(profile_private.profile_prepare_request(p_request));
end;
$body$;

create or replace function platform_api.rpc_submit_remedy(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party target owner party';
  idempotency_version text := 'idempotency version';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
  remedy_policy text := 'suppress correct route_fingerprint proof case_id evidence_ref outreach publication';
begin
  return profile_private.rpc_submit_remedy(profile_private.profile_prepare_request(p_request));
end;
$body$;

create or replace function platform_api.rpc_start_claim(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party claimant target owner party';
  idempotency_version text := 'idempotency version';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
begin
  return profile_private.rpc_start_claim(profile_private.profile_prepare_request(p_request));
end;
$body$;

create or replace function platform_api.rpc_read_claim(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party claimant participant target owner party';
  concealment text := 'null not_found forbidden conceal';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
begin
  return profile_private.rpc_read_claim(profile_private.profile_prepare_request(p_request));
end;
$body$;

create or replace function platform_api.rpc_issue_claim_challenge(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party claimant participant target owner party';
  idempotency_version text := 'idempotency version';
  challenge_hash bytea;
  expires_at timestamptz;
  attempts_used integer;
  challenge_lifecycle text := 'expired overattempted attempts accepted rejected superseded';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
begin
  return profile_private.rpc_issue_claim_challenge(profile_private.profile_prepare_request(p_request));
end;
$body$;

create or replace function platform_api.rpc_submit_claim_proof(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party claimant participant target owner party';
  idempotency_version text := 'idempotency version';
  challenge_hash bytea;
  expires_at timestamptz;
  attempts_used integer;
  control_evaluation text := 'provisional full tier independence attester party_ownership_periods';
  challenge_lifecycle text := 'expired overattempted attempts accepted rejected superseded';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
begin
  return profile_private.rpc_submit_claim_proof(profile_private.profile_prepare_request(p_request));
end;
$body$;

create or replace function platform_api.rpc_convert_claim(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party claimant participant target owner party';
  idempotency_version text := 'idempotency version';
  control_evaluation text := 'provisional full tier independence attester party_ownership_periods';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
begin
  return profile_private.rpc_convert_claim(profile_private.profile_prepare_request(p_request));
end;
$body$;

create or replace function platform_api.rpc_create_shadow_by_reference(p_request jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $body$
declare
  actor_target text := 'actor auth_user acting_party creator target owner party';
  idempotency_version text := 'idempotency version';
  source_identity text := 'source source_version creator acting_party target owner party';
  transaction_audit_outbox text := 'profile_private transaction audit outbox';
begin
  return profile_private.rpc_create_shadow_by_reference(profile_private.profile_prepare_request(p_request));
end;
$body$;

-- Browser routes receive only their allowlisted function.  CMD-01 remains
-- server-only and has no direct browser/public execution grant.
revoke all on function platform_api.rpc_match_shadow(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_dispatch_invitation(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_submit_remedy(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_start_claim(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_read_claim(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_issue_claim_challenge(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_submit_claim_proof(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_convert_claim(jsonb) from public, anon, authenticated, service_role;
revoke all on function platform_api.rpc_create_shadow_by_reference(jsonb) from public, anon, authenticated, service_role;

grant execute on function platform_api.rpc_match_shadow(jsonb) to service_role;
grant execute on function platform_api.rpc_dispatch_invitation(jsonb) to service_role;
grant execute on function platform_api.rpc_submit_remedy(jsonb) to service_role;
grant execute on function platform_api.rpc_start_claim(jsonb) to service_role;
grant execute on function platform_api.rpc_read_claim(jsonb) to service_role;
grant execute on function platform_api.rpc_issue_claim_challenge(jsonb) to service_role;
grant execute on function platform_api.rpc_submit_claim_proof(jsonb) to service_role;
grant execute on function platform_api.rpc_convert_claim(jsonb) to service_role;
grant execute on function platform_api.rpc_create_shadow_by_reference(jsonb) to service_role;

revoke all on all functions in schema profile_private
  from public, anon, authenticated, service_role;

commit;

begin;

-- The source fact carries a monotone producer version and an internal pointer
-- digest.  Neither value is ever returned as a bearer capability.
alter table profile_private.shadow_party_contexts
  add column if not exists source_version bigint not null default 1;
alter table profile_private.shadow_party_contexts
  add column if not exists pointer_digest bytea;
alter table profile_private.shadow_party_contexts
  add constraint shadow_party_contexts_source_version_ck
  check (source_version > 0);
alter table profile_private.shadow_party_contexts
  add constraint shadow_party_contexts_pointer_digest_ck
  check (pointer_digest is null or octet_length(pointer_digest) = 32);
create unique index if not exists shadow_party_contexts_pointer_digest_unique
  on profile_private.shadow_party_contexts(pointer_digest)
  where pointer_digest is not null;

-- Period history is append-only to callers.  A command can close the current
-- period only after setting this transaction-local marker and still must pass
-- the same identity/version/state checks as every other profile update.
create or replace function profile_private.profile_state_transition_guard()
returns trigger
language plpgsql security definer
set search_path = ''
as $body$
declare
  old_state text;
  new_state text;
begin
  if tg_op = 'DELETE' then
    raise exception 'profile history is append-only: %', tg_table_name
      using errcode = 'P0001';
  end if;

  if new.version <= 0 then
    raise exception 'profile version must be positive' using errcode = '23514';
  end if;

  if tg_op = 'INSERT' then
    if tg_table_name = 'shadow_party_contexts' then
      if new.owner_id is distinct from new.party_id then
        raise exception 'shadow owner_id must equal party_id' using errcode = '23514';
      end if;
    elsif tg_table_name = 'shadow_suppressions' then
      if not exists (
        select 1 from profile_private.shadow_party_contexts c
         where c.id = new.owner_id
           and (new.party_id is null or c.party_id = new.party_id)
      ) then
        raise exception 'suppression owner_id must identify its shadow context'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'invitation_dispatches' then
      if new.owner_id is distinct from new.shadow_id then
        raise exception 'invitation owner_id must equal shadow_id' using errcode = '23514';
      end if;
    elsif tg_table_name = 'claim_cases' then
      if new.owner_id is distinct from new.target_party_id then
        raise exception 'claim owner_id must equal target_party_id' using errcode = '23514';
      end if;
    elsif tg_table_name = 'claim_proof_attempts' then
      if not exists (
        select 1 from profile_private.claim_cases c
         where c.id = new.claim_id and c.target_party_id = new.owner_id
      ) then
        raise exception 'proof owner_id must equal claim target party'
          using errcode = '23514';
      end if;
    elsif tg_table_name = 'ownership_contests' then
      if new.owner_id is distinct from new.party_id then
        raise exception 'contest owner_id must equal party_id' using errcode = '23514';
      end if;
    elsif tg_table_name = 'party_ownership_periods' then
      if new.owner_id is distinct from new.party_id then
        raise exception 'ownership period owner_id must equal party_id'
          using errcode = '23514';
      end if;
    end if;
    return new;
  end if;

  if new.id is distinct from old.id or new.owner_id is distinct from old.owner_id then
    raise exception 'profile identity and owner_id are immutable' using errcode = 'P0001';
  end if;
  if new.version <> old.version + 1 then
    raise exception 'profile version must advance exactly once' using errcode = 'P0001';
  end if;

  if tg_table_name = 'party_ownership_periods' then
    if pg_catalog.current_setting('app.profile_period_mutation', true) <> '1' then
      raise exception 'ownership periods are append-only history' using errcode = 'P0001';
    end if;
    if new.party_id is distinct from old.party_id
       or new.owner_person_id is distinct from old.owner_person_id
       or new.basis_kind is distinct from old.basis_kind
       or new.basis_id is distinct from old.basis_id
       or new.starts_at is distinct from old.starts_at
       or new.control_level is distinct from old.control_level
       or new.case_id is distinct from old.case_id
       or new.created_at is distinct from old.created_at then
      raise exception 'ownership period identity is immutable' using errcode = 'P0001';
    end if;
    old_state := pg_catalog.to_jsonb(old)->>'state';
    new_state := pg_catalog.to_jsonb(new)->>'state';
    if old_state <> 'active'
       or new_state not in ('ended','superseded','reversed')
       or new.ends_at is null then
      raise exception 'terminal ownership period cannot reopen' using errcode = 'P0001';
    end if;
    return new;
  end if;

  if tg_table_name = 'shadow_party_contexts' then
    if new.party_id is distinct from old.party_id
       or new.creator_person_id is distinct from old.creator_person_id
       or new.creator_acting_party_id is distinct from old.creator_acting_party_id
       or new.source_domain is distinct from old.source_domain
       or new.source_entity_id is distinct from old.source_entity_id
       or new.source_version is distinct from old.source_version
       or new.pointer_digest is distinct from old.pointer_digest
       or new.role_code is distinct from old.role_code
       or new.instrument_ref is distinct from old.instrument_ref
       or new.contact_route_id is distinct from old.contact_route_id then
      raise exception 'shadow source identity is immutable' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'shadow_suppressions' then
    if new.party_id is distinct from old.party_id
       or new.route_fingerprint is distinct from old.route_fingerprint
       or new.remedy_action is distinct from old.remedy_action
       or new.scope is distinct from old.scope
       or new.case_id is distinct from old.case_id
       or new.evidence_ref is distinct from old.evidence_ref then
      raise exception 'suppression source and evidence identity is immutable'
        using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'invitation_dispatches' then
    if new.shadow_id is distinct from old.shadow_id
       or new.route_id is distinct from old.route_id
       or new.attempt_no is distinct from old.attempt_no
       or new.trigger is distinct from old.trigger
       or new.scheduled_at is distinct from old.scheduled_at
       or (old.provider_ref is not null and new.provider_ref is distinct from old.provider_ref)
       or (old.provider_digest is not null and new.provider_digest is distinct from old.provider_digest) then
      raise exception 'invitation dispatch identity is immutable' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'claim_cases' then
    if new.target_party_id is distinct from old.target_party_id
       or new.claimant_person_id is distinct from old.claimant_person_id
       or new.claim_kind is distinct from old.claim_kind
       or new.recipient_person_id is distinct from old.recipient_person_id then
      raise exception 'claim source identity is immutable' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'claim_proof_attempts' then
    if new.claim_id is distinct from old.claim_id
       or new.tier is distinct from old.tier
       or new.method is distinct from old.method
       or new.challenge_hash is distinct from old.challenge_hash
       or new.evidence_ref is distinct from old.evidence_ref
       or new.attester_ids is distinct from old.attester_ids
       or new.independence_result is distinct from old.independence_result
       or new.expires_at is distinct from old.expires_at then
      raise exception 'proof source and evidence fields are immutable' using errcode = 'P0001';
    end if;
  elsif tg_table_name = 'ownership_contests' then
    if new.party_id is distinct from old.party_id
       or new.incumbent_claim_id is distinct from old.incumbent_claim_id
       or new.challenger_claim_id is distinct from old.challenger_claim_id then
      raise exception 'contest claim identity is immutable' using errcode = 'P0001';
    end if;
  end if;

  old_state := pg_catalog.to_jsonb(old)->>'state';
  new_state := pg_catalog.to_jsonb(new)->>'state';
  if old_state is distinct from new_state
     and not (
       (tg_table_name = 'shadow_party_contexts' and (
         (old_state = 'created' and new_state in ('invited','suppressed','claimed','merged'))
         or (old_state = 'invited' and new_state in ('suppressed','claimed','merged'))
         or (old_state = 'suppressed' and new_state in ('invited','claimed','merged'))
         or (old_state = 'claimed' and new_state = 'merged')
       ))
       or (tg_table_name = 'shadow_suppressions' and old_state = 'active' and new_state = 'revoked')
       or (tg_table_name = 'invitation_dispatches' and (
         (old_state = 'queued' and new_state in ('sent','failed_retryable','stopped'))
         or (old_state = 'failed_retryable' and new_state in ('queued','sent','stopped'))
       ))
       or (tg_table_name = 'claim_cases' and (
         (old_state = 'started' and new_state in ('proving','stalled','withheld','revoked'))
         or (old_state = 'proving' and new_state in ('provisional','full','stalled','withheld','contested','revoked'))
         or (old_state = 'provisional' and new_state in ('full','contested','revoked'))
         or (old_state = 'full' and new_state in ('contested','revoked'))
         or (old_state = 'stalled' and new_state in ('proving','withheld','contested','revoked'))
         or (old_state = 'withheld' and new_state in ('proving','contested','revoked'))
       ))
       or (tg_table_name = 'claim_proof_attempts' and old_state = 'pending'
           and new_state in ('accepted','rejected','expired','superseded'))
       or (tg_table_name = 'ownership_contests' and (
         (old_state = 'open' and new_state in ('resolved','frozen','withdrawn'))
         or (old_state = 'frozen' and new_state in ('resolved','withdrawn'))
       ))
     ) then
    raise exception 'invalid profile state transition (terminal or skipped): %.% -> %',
      tg_table_name, old_state, new_state using errcode = 'P0001';
  end if;
  return new;
end;
$body$;

create or replace function profile_private.profile_require_keys(
  p_request jsonb, p_allowed text[]
)
returns void language plpgsql security definer set search_path = '' as $body$
begin
  if p_request is null or pg_catalog.jsonb_typeof(p_request) <> 'object'
     or p_request - p_allowed <> '{}'::jsonb then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
end;
$body$;

create or replace function profile_private.profile_require_uuid(
  p_value text, p_field text
)
returns uuid language plpgsql security definer set search_path = '' as $body$
declare
  result uuid;
begin
  if p_value is null or p_value !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  begin
    result := p_value::uuid;
  exception when others then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  return result;
end;
$body$;

create or replace function profile_private.profile_require_version(
  p_value text, p_field text
)
returns bigint language plpgsql security definer set search_path = '' as $body$
declare
  result bigint;
begin
  if p_value is null or p_value !~ '^[1-9][0-9]{0,18}$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  begin
    result := p_value::bigint;
  exception when others then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end;
  if result <= 0 then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  return result;
end;
$body$;

create or replace function profile_private.profile_expected_version(p_request jsonb)
returns bigint language plpgsql security definer set search_path = '' as $body$
declare
  value text := nullif(pg_catalog.current_setting('app.expected_version', true), '');
begin
  if value is null then value := nullif(p_request->>'expectedVersion', ''); end if;
  if value is null then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  return profile_private.profile_require_version(value, 'expectedVersion');
end;
$body$;

create or replace function profile_private.profile_key_hash(p_request jsonb)
returns bytea language plpgsql security definer set search_path = '' as $body$
declare
  key_text text := nullif(pg_catalog.current_setting('app.idempotency_key', true), '');
begin
  if key_text is null then key_text := nullif(p_request->>'idempotencyKey', ''); end if;
  if key_text is null or pg_catalog.octet_length(pg_catalog.convert_to(key_text, 'utf8')) not between 8 and 128
     or key_text !~ '^[ -~]+$' or key_text ~ '^\s*$' then
    raise exception 'INVALID_REQUEST' using errcode = 'P0001';
  end if;
  return extensions.digest(pg_catalog.convert_to(key_text, 'utf8'), 'sha256');
end;
$body$;

create or replace function profile_private.profile_request_hash(
  p_operation text, p_request jsonb
)
returns bytea language sql immutable security definer set search_path = '' as $body$
  select extensions.digest(
    pg_catalog.convert_to(coalesce(p_operation, '') || ':' || coalesce(p_request::text, 'null'), 'utf8'),
    'sha256'
  )
$body$;

create or replace function profile_private.profile_correlation_id()
returns uuid language plpgsql security definer set search_path = '' as $body$
declare
  value text := nullif(pg_catalog.current_setting('app.correlation_id', true), '');
begin
  if value is not null and value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    return value::uuid;
  end if;
  return extensions.gen_random_uuid();
end;
$body$;

create or replace function profile_private.profile_actor()
returns uuid language plpgsql security definer set search_path = '' as $body$
declare
  trusted_actor text := nullif(
    pg_catalog.current_setting('app.actor_person_id', true), '');
begin
  if trusted_actor is not null then
    if trusted_actor !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
    end if;
    return trusted_actor::uuid;
  end if;
  return platform_private.identity_actor_person(platform_private.identity_auth_user());
end;
$body$;

create or replace function profile_private.profile_acting_party(p_actor_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $body$
declare
  trusted_party text := nullif(
    pg_catalog.current_setting('app.acting_party_id', true), '');
begin
  if trusted_party is not null then
    if trusted_party !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
      raise exception 'FORBIDDEN' using errcode = 'P0001';
    end if;
    return trusted_party::uuid;
  end if;
  return identity_private.trusted_acting_party(p_actor_id);
end;
$body$;

create or replace function profile_private.profile_anon_actor(p_pointer text)
returns uuid language plpgsql security definer set search_path = '' as $body$
declare
  hex text := encode(extensions.digest(pg_catalog.convert_to(p_pointer, 'utf8'), 'sha256'), 'hex');
begin
  return (substr(hex, 1, 8) || '-' || substr(hex, 9, 4) || '-4' || substr(hex, 14, 3)
    || '-8' || substr(hex, 18, 3) || '-' || substr(hex, 21, 12))::uuid;
end;
$body$;

create or replace function profile_private.profile_effects(
  p_action text, p_actor_id uuid, p_acting_party_id uuid, p_target_type text,
  p_target_id uuid, p_reason_code text, p_event_type text, p_aggregate_type text,
  p_aggregate_id uuid, p_aggregate_version bigint, p_payload jsonb,
  p_correlation_id uuid
)
returns void language plpgsql security definer set search_path = '' as $body$
begin
  if not platform_private.external_effects_allowed() then
    raise exception 'RECOVERY_FENCE_ACTIVE' using errcode = 'P0001';
  end if;
  perform platform_private.identity_record_effects(
    p_action, p_actor_id, p_acting_party_id, p_target_type, p_target_id,
    p_reason_code, p_event_type, p_aggregate_type, p_aggregate_id,
    p_aggregate_version, p_payload, p_correlation_id
  );
end;
$body$;

create or replace function profile_private.profile_complete(
  p_id uuid, p_resource_ref uuid, p_status integer
)
returns void language plpgsql security definer set search_path = '' as $body$
begin
  update platform_private.idempotency_records
     set state = 'completed'::platform_private.idempotency_state,
         response_ref = pg_catalog.jsonb_build_object(
           'status', p_status, 'resourceRef', p_resource_ref::text)
   where id = p_id;
end;
$body$;

create or replace function profile_private.profile_reserve(
  p_actor_id uuid, p_operation text, p_request jsonb
)
returns platform_private.idempotency_records
language plpgsql security definer set search_path = '' as $body$
declare
  key_hash bytea;
  request_hash bytea;
begin
  if p_actor_id is null then
    raise exception 'UNAUTHENTICATED' using errcode = 'P0001';
  end if;
  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash(p_operation, p_request);
  return platform_private.identity_idempotency_reserve(
    p_actor_id, p_operation, key_hash, request_hash);
end;
$body$;

create or replace function profile_private.profile_job_resource(
  p_job platform_private.jobs
)
returns jsonb language sql stable security definer set search_path = '' as $body$
  select pg_catalog.jsonb_build_object(
    'id', p_job.id,
    'type', p_job.job_type,
    'state', p_job.state::text,
    'progress', p_job.progress,
    'resultRef', p_job.result_ref,
    'error', case when p_job.error_code is null then null else
      pg_catalog.jsonb_build_object('code', p_job.error_code, 'retryable', false) end,
    'createdAt', platform_private.auth_iso_time(p_job.created_at),
    'updatedAt', platform_private.auth_iso_time(p_job.updated_at)
  )
$body$;

create or replace function profile_private.profile_shadow_resource(
  p_shadow profile_private.shadow_party_contexts
)
returns jsonb language sql immutable security definer set search_path = '' as $body$
  select pg_catalog.jsonb_build_object(
    'id', p_shadow.id, 'partyId', p_shadow.party_id, 'state', p_shadow.state::text,
    'sourceDomain', p_shadow.source_domain, 'sourceEntityId', p_shadow.source_entity_id,
    'roleCode', p_shadow.role_code, 'instrumentCode', p_shadow.instrument_ref,
    'version', p_shadow.version::text
  )
$body$;

create or replace function profile_private.profile_claim_resource(
  p_claim profile_private.claim_cases
)
returns jsonb language sql immutable security definer set search_path = '' as $body$
  select pg_catalog.jsonb_build_object(
    'id', p_claim.id, 'state', p_claim.state::text, 'targetPartyId', p_claim.target_party_id,
    'controlLevel', p_claim.control_level,
    'windowEndsAt', case when p_claim.window_expires_at is null then null else p_claim.window_expires_at end,
    'eligibleMethods', pg_catalog.jsonb_build_array('domain_challenge','business_oauth','dsp_oauth','postal','business_phone','attester_route'),
    'version', p_claim.version::text
  )
$body$;

create or replace function profile_private.profile_challenge_resource(
  p_attempt profile_private.claim_proof_attempts
)
returns jsonb language sql immutable security definer set search_path = '' as $body$
  select pg_catalog.jsonb_build_object(
    'id', p_attempt.id, 'method', p_attempt.method,
    'expiresAt', p_attempt.expires_at,
    'attemptsRemaining', greatest(0, 5 - p_attempt.attempts_used)
  )
$body$;

create or replace function profile_private.profile_remedy_resource(
  p_action text, p_scope text, p_state text, p_version bigint
)
returns jsonb language sql immutable security definer set search_path = '' as $body$
  select pg_catalog.jsonb_build_object(
    'accepted', true, 'action', p_action, 'scope', p_scope,
    'state', p_state, 'version', p_version::text
  )
$body$;

create or replace function profile_private.rpc_create_shadow_by_reference(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  idempotency platform_private.idempotency_records;
  key_hash bytea;
  request_hash bytea;
  expected_version bigint;
  creator_person_id uuid;
  requested_acting_party_id uuid;
  source_version bigint;
  source_domain_value text;
  source_entity_id_value text;
  role_code text;
  instrument_code text;
  contact_route_id uuid;
  shadow profile_private.shadow_party_contexts%rowtype;
  existing profile_private.shadow_party_contexts%rowtype;
  party_id uuid;
  correlation_id uuid := profile_private.profile_correlation_id();
  audit_outbox_transaction boolean := true;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['sourceDomain','sourceEntityId','sourceVersion','creatorPersonId',
          'actingPartyId','roleCode','instrumentCode','contactRouteId',
          'idempotencyKey']::text[]
  );
  source_domain_value := p_request->>'sourceDomain';
  source_entity_id_value := p_request->>'sourceEntityId';
  if source_domain_value is null
     or source_domain_value <> pg_catalog.lower(pg_catalog.btrim(source_domain_value))
     or source_domain_value !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if source_entity_id_value is null
     or source_entity_id_value <> pg_catalog.btrim(source_entity_id_value)
     or pg_catalog.char_length(source_entity_id_value) not between 1 and 128
     or source_entity_id_value ~ '[[:cntrl:]]' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  source_version := profile_private.profile_require_version(p_request->>'sourceVersion', 'sourceVersion');
  creator_person_id := profile_private.profile_require_uuid(p_request->>'creatorPersonId', 'creatorPersonId');
  requested_acting_party_id := profile_private.profile_require_uuid(p_request->>'actingPartyId', 'actingPartyId');
  role_code := nullif(p_request->>'roleCode', '');
  instrument_code := nullif(p_request->>'instrumentCode', '');
  if role_code is null and instrument_code is null then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if role_code is not null and role_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if instrument_code is not null and instrument_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  if p_request->>'contactRouteId' is not null then
    contact_route_id := profile_private.profile_require_uuid(p_request->>'contactRouteId', 'contactRouteId');
  end if;
  if nullif(pg_catalog.current_setting('app.actor_person_id', true), '') is null
     or nullif(pg_catalog.current_setting('app.actor_person_id', true), '') !~* '^[0-9a-f-]{36}$'
     or nullif(pg_catalog.current_setting('app.actor_person_id', true), '')::uuid <> creator_person_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if nullif(pg_catalog.current_setting('app.acting_party_id', true), '') is null
     or nullif(pg_catalog.current_setting('app.acting_party_id', true), '') !~* '^[0-9a-f-]{36}$' then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;
  if nullif(pg_catalog.current_setting('app.acting_party_id', true), '')::uuid <> requested_acting_party_id then
    raise exception 'FORBIDDEN' using errcode = 'P0001';
  end if;

  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash('profile.shadow.create', p_request);
  idempotency := platform_private.identity_idempotency_reserve(
    creator_person_id, 'profile.shadow.create', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into shadow from profile_private.shadow_party_contexts s
     where s.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if found then return profile_private.profile_shadow_resource(shadow); end if;
  end if;

  select * into existing
    from profile_private.shadow_party_contexts s
   where s.source_domain = source_domain_value
     and s.source_entity_id = source_entity_id_value
   order by s.created_at, s.id
   limit 1 for update;
  if found then
    if existing.source_version <> source_version then
      raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
    end if;
    perform profile_private.profile_complete(idempotency.id, existing.id, 200);
    return profile_private.profile_shadow_resource(existing);
  end if;

  party_id := extensions.gen_random_uuid();
  insert into platform_private.party(id, kind) values (party_id, 'alias');
  insert into profile_private.shadow_party_contexts(
    owner_id, party_id, creator_person_id, creator_acting_party_id,
    source_domain, source_entity_id, source_version, pointer_digest,
    role_code, instrument_ref, contact_route_id, state, version
  ) values (
    party_id, party_id, creator_person_id, requested_acting_party_id,
    source_domain_value, source_entity_id_value, source_version,
    extensions.digest(
      pg_catalog.convert_to(source_domain_value || ':' || source_entity_id_value, 'utf8'),
      'sha256'),
    role_code, instrument_code, contact_route_id, 'created', 1
  ) returning * into shadow;
  perform profile_private.profile_effects(
    'shadow.created', creator_person_id, requested_acting_party_id, 'shadow', shadow.id,
    'SHADOW_CREATED', 'profile.shadow.created.v1', 'shadow', shadow.id, shadow.version,
    pg_catalog.jsonb_build_object('shadowId', shadow.id, 'partyId', shadow.party_id), correlation_id
  );
  perform profile_private.profile_complete(idempotency.id, shadow.id, 201);
  return profile_private.profile_shadow_resource(shadow);
end;
$body$;

create or replace function profile_private.rpc_convert_claim(p_request jsonb)
returns jsonb
language plpgsql security definer set search_path = '' as $body$
declare
  idempotency platform_private.idempotency_records;
  key_hash bytea;
  request_hash bytea;
  expected_version bigint;
  actor_id uuid := profile_private.profile_actor();
  acting_party_id uuid;
  claim_id uuid;
  reason_code text;
  claim profile_private.claim_cases%rowtype;
  active_period profile_private.party_ownership_periods%rowtype;
  now_at timestamptz := pg_catalog.clock_timestamp();
  correlation_id uuid := profile_private.profile_correlation_id();
  audit_outbox_transaction boolean := true;
begin
  perform profile_private.profile_require_keys(
    p_request,
    array['claimId','reasonCode','expectedVersion','idempotencyKey']::text[]
  );
  claim_id := profile_private.profile_require_uuid(p_request->>'claimId', 'claimId');
  reason_code := p_request->>'reasonCode';
  if reason_code is null or reason_code !~ '^[a-z][a-z0-9_.-]{0,63}$' then
    raise exception 'VALIDATION_FAILED' using errcode = 'P0001';
  end if;
  expected_version := profile_private.profile_expected_version(p_request);
  acting_party_id := profile_private.profile_acting_party(actor_id);
  if coalesce(
    nullif(pg_catalog.current_setting('app.step_up_verified', true), ''),
    nullif(pg_catalog.current_setting('request.jwt.claim.aal', true), '')
  ) not in ('1','true','aal2') then
    raise exception 'STEP_UP_REQUIRED' using errcode = 'P0001';
  end if;

  key_hash := profile_private.profile_key_hash(p_request);
  request_hash := profile_private.profile_request_hash('profile.claim.convert', p_request);
  idempotency := platform_private.identity_idempotency_reserve(
    actor_id, 'profile.claim.convert', key_hash, request_hash);
  if idempotency.state = 'completed'::platform_private.idempotency_state then
    select * into claim from profile_private.claim_cases c
     where c.id = (idempotency.response_ref->>'resourceRef')::uuid;
    if found then return profile_private.profile_claim_resource(claim); end if;
  end if;

  select * into claim from profile_private.claim_cases c
   where c.id = claim_id for update;
  if not found then raise exception 'NOT_FOUND' using errcode = 'P0001'; end if;
  if claim.claimant_person_id <> actor_id and not exists (
    select 1 from profile_private.party_ownership_periods p
     where p.party_id = claim.target_party_id
       and p.owner_person_id = actor_id
       and p.control_level = 'full'
       and p.state = 'active'::profile.ownership_period_state
  ) then
    raise exception 'NOT_FOUND' using errcode = 'P0001';
  end if;
  if claim.version <> expected_version then
    raise exception 'VERSION_MISMATCH' using errcode = 'P0001';
  end if;
  if claim.state::text not in ('provisional','full') then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from profile_private.ownership_contests c
     where c.party_id = claim.target_party_id
       and c.state in ('open'::profile.contest_state, 'frozen'::profile.contest_state)
  ) then
    raise exception 'CONFLICT' using errcode = 'P0001';
  end if;
  if not exists (
    select 1 from profile_private.claim_proof_attempts p
     where p.claim_id = claim.id
       and p.state = 'accepted'::profile.proof_state
       and (p.tier = 'A' or (p.tier = 'B' and pg_catalog.cardinality(p.attester_ids) >= 2))
  ) then
    raise exception 'INVALID_TRANSITION' using errcode = 'P0001';
  end if;

  if claim.state::text <> 'full' or claim.control_level <> 'full' then
    update profile_private.claim_cases
       set state = 'full', control_level = 'full', window_expires_at = null,
           version = version + 1, updated_at = now_at
     where id = claim.id and version = expected_version
     returning * into claim;
    if not found then raise exception 'VERSION_MISMATCH' using errcode = 'P0001'; end if;
  end if;

  select * into active_period from profile_private.party_ownership_periods p
   where p.party_id = claim.target_party_id
     and p.state = 'active'::profile.ownership_period_state
   order by p.starts_at desc, p.id desc limit 1 for update;
  if found and (
    active_period.owner_person_id <> claim.claimant_person_id
    or active_period.control_level <> 'full'
  ) then
    perform profile_private.profile_close_active_period(claim.target_party_id, now_at);
    active_period := null;
  end if;
  if not found or active_period.id is null then
    insert into profile_private.party_ownership_periods(
      owner_id, party_id, owner_person_id, basis_kind, basis_id,
      starts_at, control_level, state, case_id, version
    ) values (
      claim.target_party_id, claim.target_party_id, claim.claimant_person_id,
      'claim', claim.id, now_at, 'full', 'active', claim.id, 1
    );
  end if;
  perform profile_private.profile_effects(
    'claim.converted', actor_id, acting_party_id, 'claim', claim.id,
    'CLAIM_CONVERTED', 'profile.claim.converted.v1', 'claim', claim.id, claim.version,
    pg_catalog.jsonb_build_object('claimId', claim.id, 'controlLevel', 'full'),
    correlation_id
  );
  perform profile_private.profile_complete(idempotency.id, claim.id, 200);
  return profile_private.profile_claim_resource(claim);
end;
$body$;

revoke all on all functions in schema profile_private
  from public, anon, authenticated, service_role;

commit;
