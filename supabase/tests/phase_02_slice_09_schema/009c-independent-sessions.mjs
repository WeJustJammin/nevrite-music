#!/usr/bin/env node

/**
 * AC217 local evidence runner. Every call is a fresh `psql` process, so the
 * lease/cursor proof crosses committed PostgreSQL sessions. Run only against
 * the disposable local Supabase database; immutable test rows are retained by
 * the database contract and should be removed with the next local reset.
 */
import { randomUUID } from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';

const container = process.env.AC217_DB_CONTAINER ?? 'supabase_db_wejammin';
const userId = randomUUID();
const reviewerId = randomUUID();
const contextId = randomUUID();
const typeId = randomUUID();
const sourceId = randomUUID();
const targetId = randomUUID();
const sourceArtifactId = randomUUID();
const artifactId = randomUUID();
const planId = randomUUID();
const dryRunId = randomUUID();
const reviewId = randomUUID();
const correlationId = randomUUID();
const typeKey = `ac217_${randomUUID().replaceAll('-', '').slice(0, 12)}`;
const fieldPrefix = 'a2170000-0000-4000-8000-';
const sql = (value) => `'${String(value).replaceAll("'", "''")}'`;
const json = (value) => `${sql(JSON.stringify(value))}::jsonb`;

const psqlArgs = (statement) => [
  'exec',
  '-i',
  container,
  'psql',
  '-X',
  '-v',
  'ON_ERROR_STOP=1',
  '-U',
  'postgres',
  '-d',
  'postgres',
  '-At',
  '-c',
  statement,
];

const runSql = (statement) => {
  const result = spawnSync('docker', psqlArgs(statement), {
    encoding: 'utf8',
    timeout: 30_000,
    killSignal: 'SIGKILL',
  });
  if (result.error || result.status !== 0) {
    const detail = (result.stderr || result.error?.message || 'psql failed')
      .trim()
      .split('\n')
      .slice(-4)
      .join(' ');
    throw new Error(`local PostgreSQL session failed: ${detail}`);
  }
  return result.stdout.trim();
};

const runSqlAsync = (statement) =>
  new Promise((resolve, reject) => {
    const child = spawn('docker', psqlArgs(statement), { encoding: 'utf8' });
    let stdout = '';
    let stderr = '';
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, 30_000);
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error('local PostgreSQL session exceeded 30 seconds'));
        return;
      }
      if (code !== 0) {
        reject(
          new Error(
            `local PostgreSQL session failed: ${stderr.trim().split('\n').slice(-4).join(' ')}`,
          ),
        );
        return;
      }
      resolve(stdout.trim());
    });
  });

const lastLine = (output) =>
  output
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .at(-1);
const runJson = (statement) => JSON.parse(lastLine(runSql(statement)));
const runJsonAsync = async (statement) =>
  JSON.parse(lastLine(await runSqlAsync(statement)));
const runValue = (statement) => lastLine(runSql(statement));
const stableJson = (value) =>
  Array.isArray(value)
    ? value.map(stableJson)
    : value && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, stableJson(value[key])]),
        )
      : value;
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const workerContext =
  "select set_config('request.jwt.claim.role','service_role',true); select set_config('app.cms_rpc','true',true);";
const call = (name, request) =>
  runJson(`${workerContext} select platform_api.${name}(${json(request)});`);
const callAsync = (name, request) =>
  runJsonAsync(
    `${workerContext} select platform_api.${name}(${json(request)});`,
  );
const independentCompiler = () =>
  runJson(`with request as (select jsonb_build_object(
  'typeKey', type_row.type_key, 'label', target.labels->>'label', 'ownerCapability', type_row.owner_capability,
  'sourceLocale', target.source_locale, 'defaultLocale', target.default_locale, 'workflowKey', target.workflow_key,
  'workflowVersion', target.workflow_version::text, 'defaultTemplateVersionId', target.default_template_version_id,
  'fields', (select jsonb_agg(jsonb_build_object('stableFieldId',field.stable_field_id,'key',field.field_key,'kind',field.kind,'constraints',field.constraints,'required',field.required,'validatorKey',field.validator_key,'validatorVersion',field.validator_version,'defaultMode',field.default_mode,'localizationMode',field.localization_mode,'editorConfig',field.editor_config,'lifecycle',field.state) order by field.stable_field_id,field.field_key) from platform_private.cms_field_definition_versions field where field.content_type_version_id=target.id),
  'relations','[]'::jsonb, 'templateBindings','[]'::jsonb, 'capabilityBindings','[]'::jsonb) request from platform_private.cms_content_type_versions target join platform_private.cms_content_types type_row on type_row.id=target.content_type_id where target.id=${sql(targetId)}::uuid)
select jsonb_build_object('artifactHash',platform_private.cms_definition_artifact_hash(request),'editor',platform_private.cms_compiled_editor_manifest(request),'renderer',platform_private.cms_compiled_renderer_manifest(request),'fieldCount',jsonb_array_length(request->'fields')) from request;`);
const fingerprints = () => {
  const compiled = independentCompiler();
  const stored = runJson(
    `select jsonb_build_object('artifactHash',artifact_hash,'editor',editor_manifest,'renderer',renderer_manifest) from platform_private.cms_schema_artifacts where id=${sql(artifactId)}::uuid;`,
  );
  assert(
    compiled.fieldCount === 128 &&
      compiled.artifactHash === stored.artifactHash &&
      JSON.stringify(stableJson(compiled.editor)) ===
        JSON.stringify(stableJson(stored.editor)) &&
      JSON.stringify(stableJson(compiled.renderer)) ===
        JSON.stringify(stableJson(stored.renderer)),
    'fresh production compiler output diverged from persisted artifact',
  );
  return {
    compilerHash: compiled.artifactHash,
    sourceHash: runValue(
      `select definition_hash from platform_private.cms_content_type_versions where id=${sql(sourceId)};`,
    ),
    targetHash: runValue(
      `select definition_hash from platform_private.cms_content_type_versions where id=${sql(targetId)};`,
    ),
  };
};

const setup = (organizationId) => {
  const sourceRequest = `jsonb_build_object('typeKey',${sql(typeKey)},'label','AC217 source','ownerCapability','cms.schema_designer','sourceLocale','en-US','defaultLocale','en-US','workflowKey','editorial','workflowVersion','1','defaultTemplateVersionId',null,'fields','[]'::jsonb,'relations','[]'::jsonb,'templateBindings','[]'::jsonb,'capabilityBindings','[]'::jsonb)`;
  const sourceHashExpr = `platform_private.cms_definition_artifact_hash(${sourceRequest})`;
  const contextHash = `platform_private.cfg_hash_json(jsonb_build_object('actingContextId', ${sql(contextId)}::uuid))`;
  const policyHash =
    "encode(extensions.digest(convert_to('cms.schema.activate:1:1:' || jsonb_build_array('cms.schema_designer')::text,'utf8'),'sha256'),'hex')";
  runSql(`
begin;
${workerContext} select set_config('app.cfg_rpc','true',true);
insert into platform_private.cms_content_types(
  id, owner_id, state, version, type_key, owner_capability, built_in, created_by
) values (
  ${sql(typeId)}::uuid, ${sql(organizationId)}::uuid, 'active', 1, ${sql(typeKey)},
  'cms.schema_designer', false, ${sql(userId)}::uuid
);
insert into platform_private.cms_content_type_versions(
  id, owner_id, state, version, content_type_id, version_no, labels,
  workflow_key, workflow_version, source_locale, default_locale,
  schema_artifact_id, definition_hash, compatibility, supersedes_id, dry_run_id,
  created_by, approved_at, activation_workflow_policy_key,
  activation_workflow_policy_version, activation_workflow_policy_hash,
  activation_required_decision_count, activation_required_capabilities,
  activation_approval_evidence_hash
) values
  (${sql(sourceId)}::uuid, ${sql(organizationId)}::uuid, 'active', 1, ${sql(typeId)}::uuid, 1,
   jsonb_build_object('label','AC217 source'), 'editorial', 1, 'en-US', 'en-US',
    ${sql(sourceArtifactId)}::uuid, ${sourceHashExpr}, 'additive', null, null,
   ${sql(userId)}::uuid, clock_timestamp(), 'cms.schema.activate', 1,
   repeat('d',64), 1, jsonb_build_array('cms.schema_designer'), repeat('e',64)),
  (${sql(targetId)}::uuid, ${sql(organizationId)}::uuid, 'approved', 1, ${sql(typeId)}::uuid, 2,
   jsonb_build_object('label','AC217 target 128'), 'editorial', 1, 'en-US', 'en-US',
   ${sql(artifactId)}::uuid, repeat('b',64), 'additive', ${sql(sourceId)}::uuid,
   ${sql(dryRunId)}::uuid, ${sql(userId)}::uuid, clock_timestamp(), null, null, null,
   null, null, null);
with request as (select ${sourceRequest} value), compiled as (select platform_private.cms_compiled_editor_manifest(value) editor_manifest,platform_private.cms_compiled_renderer_manifest(value) renderer_manifest,platform_private.cms_definition_artifact_hash(value) artifact_hash from request)
insert into platform_private.cms_schema_artifacts(id,owner_id,state,version,content_type_version_id,compiler_version,zod_contract_ref,editor_manifest,renderer_manifest,artifact_hash,compiled_at)
select ${sql(sourceArtifactId)}::uuid,${sql(organizationId)}::uuid,'compiled',1,${sql(sourceId)}::uuid,'1',${sql(`cms/content-type/${typeKey}/v1`)},editor_manifest,renderer_manifest,artifact_hash,clock_timestamp() from compiled;
insert into platform_private.cms_field_definition_versions(
  owner_id, state, version, content_type_version_id, stable_field_id, field_key,
  kind, constraints, required, validator_key, validator_version, default_mode,
  localization_mode, editor_config, created_by
)
select ${sql(organizationId)}::uuid, 'active', 1, ${sql(targetId)}::uuid,
       (${sql(fieldPrefix)} || lpad(number::text,12,'0'))::uuid,
       'field_' || lpad(number::text,3,'0'), 'short_text', '{}'::jsonb, false,
       null, null, 'none', 'none', jsonb_build_object('label','Field ' || number, 'order',number),
       ${sql(userId)}::uuid
from generate_series(1,128) generated(number);
with request as (
  select jsonb_build_object(
    'typeKey', type_row.type_key, 'label', target.labels->>'label',
    'ownerCapability', type_row.owner_capability, 'sourceLocale', target.source_locale,
    'defaultLocale', target.default_locale, 'workflowKey', target.workflow_key,
    'workflowVersion', target.workflow_version::text,
    'defaultTemplateVersionId', target.default_template_version_id,
    'fields', (select jsonb_agg(jsonb_build_object(
      'stableFieldId', field.stable_field_id, 'key', field.field_key, 'kind', field.kind,
      'constraints', field.constraints, 'required', field.required,
      'validatorKey', field.validator_key, 'validatorVersion', field.validator_version,
      'defaultMode', field.default_mode, 'localizationMode', field.localization_mode,
      'editorConfig', field.editor_config, 'lifecycle', field.state
    ) order by field.stable_field_id, field.field_key)
      from platform_private.cms_field_definition_versions field
      where field.content_type_version_id = target.id),
    'relations','[]'::jsonb, 'templateBindings','[]'::jsonb, 'capabilityBindings','[]'::jsonb
  ) value
  from platform_private.cms_content_type_versions target
  join platform_private.cms_content_types type_row on type_row.id=target.content_type_id
  where target.id=${sql(targetId)}::uuid
), compiled as (
  select platform_private.cms_compiled_editor_manifest(value) editor_manifest,
         platform_private.cms_compiled_renderer_manifest(value) renderer_manifest,
         platform_private.cms_definition_artifact_hash(value) artifact_hash
  from request
)
insert into platform_private.cms_schema_artifacts(
  id, owner_id, state, version, content_type_version_id, compiler_version,
  zod_contract_ref, editor_manifest, renderer_manifest, artifact_hash, compiled_at
)
select ${sql(artifactId)}::uuid, ${sql(organizationId)}::uuid, 'compiled', 1,
       ${sql(targetId)}::uuid, '1', ${sql(`cms/content-type/${typeKey}/v1`)},
       editor_manifest, renderer_manifest, artifact_hash, clock_timestamp()
from compiled;
update platform_private.cms_content_type_versions
set definition_hash=(select artifact_hash from platform_private.cms_schema_artifacts where id=${sql(artifactId)}::uuid),
    activation_workflow_policy_key='cms.schema.activate', activation_workflow_policy_version=1,
    activation_workflow_policy_hash=${policyHash}, activation_required_decision_count=1,
    activation_required_capabilities=jsonb_build_array('cms.schema_designer'),
    activation_approval_evidence_hash=repeat('c',64)
where id=${sql(targetId)}::uuid;
insert into platform_private.cms_schema_dry_run_reports(
  id, owner_id, content_type_id, source_version_id, target_version_id, classification,
  transform_key, transform_version, source_hash, target_hash, compiler_hash,
  compiler_version, source_count, target_count, row_error_count, migrated_count,
  failed_count, result, report, created_by
)
select ${sql(dryRunId)}::uuid, ${sql(organizationId)}::uuid, ${sql(typeId)}::uuid,
       ${sql(sourceId)}::uuid, ${sql(targetId)}::uuid, 'additive', null, null,
       ${sourceHashExpr}, target.definition_hash, artifact.artifact_hash, '1', 0, 0, 0, 0, 0,
       'pass', jsonb_build_object('dryRunId',${sql(dryRunId)}::uuid,'result','pass',
         'sourceHash',${sourceHashExpr},'targetHash',target.definition_hash,
         'compilerHash',artifact.artifact_hash,'compilerVersion','1',
         'transformHash',platform_private.cms_migration_transform_hash('additive',null,null,
           ${sourceHashExpr},target.definition_hash,artifact.artifact_hash,'1'),
         'sourceCount',0,'targetCount',0,'rowErrorCount',0,'migratedCount',0,'failedCount',0,
          'lease',jsonb_build_object('state','ready','expiresAt',(clock_timestamp()+interval '1 hour')::text)),
       ${sql(userId)}::uuid
from platform_private.cms_content_type_versions target
join platform_private.cms_schema_artifacts artifact on artifact.id=target.schema_artifact_id
where target.id=${sql(targetId)}::uuid;
insert into platform_private.cms_schema_migration_plans(
  id, owner_id, state, version, content_type_id, from_version_id, to_version_id,
  classification, transform_key, transform_version, dry_run_report,
  source_count, target_count, row_error_count, migrated_count, failed_count, created_by
)
select ${sql(planId)}::uuid, ${sql(organizationId)}::uuid, 'ready', 1, ${sql(typeId)}::uuid,
       ${sql(sourceId)}::uuid, ${sql(targetId)}::uuid, 'additive', null, null,
       jsonb_build_object('sourceHash',${sourceHashExpr},'targetHash',target.definition_hash,
         'dryRunId',${sql(dryRunId)}::uuid,'transformHash',platform_private.cms_migration_transform_hash(
           'additive',null,null,${sourceHashExpr},target.definition_hash,artifact.artifact_hash,'1'),
         'compilerHash',artifact.artifact_hash,'compilerVersion','1','result','pass',
         'sourceCount','0','targetCount','0','rowErrorCount','0','migratedCount','0','failedCount','0',
          'lease',jsonb_build_object('state','ready','expiresAt',(clock_timestamp()-interval '1 minute')::text)),
       0,0,0,0,0,${sql(userId)}::uuid
from platform_private.cms_content_type_versions target
join platform_private.cms_schema_artifacts artifact on artifact.id=target.schema_artifact_id
where target.id=${sql(targetId)}::uuid;
insert into platform_private.acting_context_binding(
  id, person_id, acting_party_id, context_kind, client_binding_id, state,
  selected_at, last_seen_at, expires_at, projection_version, version
)
select ${sql(contextId)}::uuid, binding.person_id, ${sql(organizationId)}::uuid, 'organization',
       'ac217-independent-session', 'active', clock_timestamp(), clock_timestamp(),
       clock_timestamp()+interval '1 hour', 1, 1
from identity.auth_user_bindings binding where binding.auth_user_id=${sql(userId)}::uuid;
insert into platform_private.cfg_config_change_reviews(
  id, candidate_type, candidate_id, candidate_version, frozen_hash, impact_manifest,
  impact_manifest_hash, effective_context_hash, risk_class, required_approvals,
  state, submitted_by, submitted_at, version_no
)
values (${sql(reviewId)}::uuid,'setting_value',${sql(targetId)}::uuid,1,
  (select definition_hash from platform_private.cms_content_type_versions where id=${sql(targetId)}::uuid),
  '{}'::jsonb,platform_private.cfg_hash_json('{}'::jsonb),${contextHash},'high',1,'review',
  ${sql(userId)}::uuid,clock_timestamp(),1);
insert into platform_private.cfg_config_approvals(
  review_id, reviewer_person_id, acting_party_id, capability, decision, reason,
  reviewed_hash, decided_at, review_version
)
select ${sql(reviewId)}::uuid, ${sql(reviewerId)}::uuid, ${sql(organizationId)}::uuid,
       'cms.schema_designer','approve','AC217 independent activation',target.definition_hash,
       clock_timestamp(),1
from platform_private.cms_content_type_versions target where target.id=${sql(targetId)}::uuid;
update platform_private.cms_content_type_versions target
set activation_approval_evidence_hash=(
  select encode(extensions.digest(convert_to(jsonb_build_object(
    'key','cms.schema.activate','version','1','policyHash',target.activation_workflow_policy_hash,
    'riskClass','ordinary',
    'requiredDecisionCount',1,'requiredCapabilities',jsonb_build_array('cms.schema_designer'),
    'approvalEvidenceHash',encode(extensions.digest(convert_to(coalesce(jsonb_agg(jsonb_build_object(
      'reviewId',approval.review_id,'reviewerAuthUserId',approval.reviewer_person_id,
      'capability',approval.capability,'reviewedHash',approval.reviewed_hash,
      'reviewVersion',approval.review_version,'decidedAt',approval.decided_at
    ) order by approval.review_id,approval.reviewer_person_id)::text,'[]'),'utf8'),'sha256'),'hex')
  )::text,'utf8'),'sha256'),'hex')
  from platform_private.cfg_config_approvals approval
  where approval.review_id=${sql(reviewId)}::uuid and approval.decision='approve'
)
where target.id=${sql(targetId)}::uuid;
update platform_private.cfg_config_change_reviews
set state='approved', updated_at=clock_timestamp()
where id=${sql(reviewId)}::uuid;
commit;`);
};

const main = async () => {
  runSql(
    `begin; insert into auth.users(id) values (${sql(userId)}::uuid),(${sql(reviewerId)}::uuid); commit;`,
  );
  runSql(
    `select platform_api.auth_bootstrap(${sql(userId)}::uuid,decode(repeat('11',32),'hex'),decode(repeat('21',32),'hex'),${sql(randomUUID())}::uuid,${sql(randomUUID())}::uuid);`,
  );
  runSql(
    `select platform_api.auth_bootstrap(${sql(reviewerId)}::uuid,decode(repeat('12',32),'hex'),decode(repeat('22',32),'hex'),${sql(randomUUID())}::uuid,${sql(randomUUID())}::uuid);`,
  );
  const organization = runJson(`
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub',${sql(userId)},true);
select set_config('app.auth_user_id',${sql(userId)},true);
select set_config('app.actor_auth_user_id',${sql(userId)},true);
select set_config('app.actor_person_id',(select person_id::text from identity.auth_user_bindings where auth_user_id=${sql(userId)}::uuid),true);
select set_config('app.acting_party_id','',true);
select set_config('app.acting_context_id','',true);
select set_config('app.correlation_id',${sql(correlationId)},true);
select set_config('app.idempotency_key_hash','ac217-independent-org',true);
select set_config('app.request_hash','ac217-independent-org-request',true);
select platform_api.rpc_create_organization('self_member','{}'::text[]);`);
  const organizationId = organization.organizationId;
  assert(
    typeof organizationId === 'string',
    'organization RPC did not return an organization id',
  );
  runSql(`begin; ${workerContext} select set_config('app.cfg_rpc','true',true);
insert into identity_private.membership_tenure(
  id,organization_id,person_id,state,provenance,governance_mode,starts_on,accepted_at,actor_id,version
) select ${sql(randomUUID())}::uuid,${sql(organizationId)}::uuid,binding.person_id,'confirmed','invitation','ungoverned',
  current_date,clock_timestamp(),(select person_id from identity.auth_user_bindings where auth_user_id=${sql(userId)}::uuid),1
from identity.auth_user_bindings binding where binding.auth_user_id=${sql(reviewerId)}::uuid;
insert into identity_private.organization_actor_grant(organization_id,person_id,capability_code,valid_from,valid_through,active)
select ${sql(organizationId)}::uuid,binding.person_id,'cms.schema_designer',current_date,current_date+1,true
from identity.auth_user_bindings binding where binding.auth_user_id in (${sql(userId)}::uuid,${sql(reviewerId)}::uuid)
on conflict (organization_id,person_id,capability_code) do update set active=true,valid_through=excluded.valid_through;
commit;`);
  setup(organizationId);

  const base = fingerprints();
  const ready = runValue(
    `select platform_private.cms_persisted_dry_run_report_valid(${sql(dryRunId)}::uuid,${sql(organizationId)}::uuid,${sql(typeId)}::uuid,${sql(sourceId)}::uuid,${sql(targetId)}::uuid,'additive',null,null,${sql(base.sourceHash)},${sql(base.targetHash)},${sql(base.compilerHash)},'1');`,
  );
  assert(
    ready === 't',
    'production persisted dry-run validator rejected the independently compiled plan',
  );
  const common = {
    migrationPlanId: planId,
    schemaVersionId: targetId,
    ...base,
  };
  const claimOne = call('cms_claim_schema_migration_lease', {
    ...common,
    expectedVersion: '1',
    cursor: '0',
    leaseOwner: 'ac217-worker-a',
    workerId: 'ac217-worker-a',
    leaseDurationMs: '1',
    now: new Date().toISOString(),
    transformKey: null,
    transformVersion: null,
  });
  assert(
    claimOne.acquired === true && claimOne.plan.cursor === '0',
    'worker A did not acquire the committed lease',
  );
  const persisted = runJson(
    `select jsonb_build_object('version',version::text,'cursor',cursor::text,'state',state) from platform_private.cms_schema_migration_plans where id=${sql(planId)}::uuid;`,
  );
  assert(
    persisted.version === '2' && persisted.cursor === '0',
    'worker A lease/version was not visible to a new committed session',
  );

  const claimTwo = call('cms_claim_schema_migration_lease', {
    ...common,
    expectedVersion: '2',
    cursor: '0',
    leaseOwner: 'ac217-worker-b',
    workerId: 'ac217-worker-b',
    leaseDurationMs: '5000',
    now: new Date(Date.now() + 16 * 60_000).toISOString(),
    transformKey: null,
    transformVersion: null,
  });
  assert(
    claimTwo.acquired === true && claimTwo.plan.cursor === '0',
    'worker B did not resume the expired durable lease',
  );
  const batch = call('cms_process_schema_migration_batch', {
    ...common,
    expectedVersion: '3',
    cursor: '0',
    limit: '128',
    leaseToken: claimTwo.leaseToken,
    transformKey: null,
    transformVersion: null,
    correlationId,
    causationId: null,
  });
  assert(
    batch.done === true && batch.cursor === '0' && batch.migratedCount === '0',
    'worker B fabricated application rows for the zero-row plan',
  );
  const begin = call('cms_begin_schema_migration_verification', {
    migrationPlanId: planId,
    expectedVersion: '3',
    cursor: '0',
    sourceCount: '0',
    targetCount: '0',
    rowErrorCount: '0',
    migratedCount: '0',
    failedCount: '0',
    transformKey: null,
    transformVersion: null,
    ...base,
  });
  assert(
    begin.state === 'verifying' && begin.version === '4',
    'verification did not follow the committed restart',
  );
  const verified = call('cms_verify_schema_migration', {
    migrationPlanId: planId,
    schemaVersionId: targetId,
    expectedVersion: '4',
    cursor: '0',
    leaseToken: claimTwo.leaseToken,
    sourceCount: '0',
    targetCount: '0',
    rowErrorCount: '0',
    migratedCount: '0',
    failedCount: '0',
    transformKey: null,
    transformVersion: null,
    ...base,
  });
  assert(
    verified.valid === true,
    'production verifier rejected truthful zero-row counters',
  );
  const completed = call('cms_complete_schema_migration', {
    migrationPlanId: planId,
    expectedVersion: '4',
    leaseToken: claimTwo.leaseToken,
  });
  assert(
    completed.state === 'completed' && completed.cursor === '0',
    'completed plan fabricated a durable cursor',
  );

  const activationRequest = {
    migrationPlanId: planId,
    contentTypeId: typeId,
    schemaVersionId: targetId,
    expectedVersion: completed.version,
    expectedActiveVersionId: sourceId,
    transformKey: null,
    transformVersion: null,
    ...base,
    idempotencyKey: 'ac217-independent-activation-race',
    switchOnlyOnce: true,
  };
  const race = await Promise.allSettled([
    callAsync('cms_activate_schema_migration', activationRequest),
    callAsync('cms_activate_schema_migration', activationRequest),
  ]);
  assert(
    race.every((result) => result.status === 'fulfilled'),
    'concurrent activation sessions did not both complete',
  );
  const activationA = race[0].value;
  const activationB = race[1].value;
  assert(
    JSON.stringify(stableJson(activationA)) ===
      JSON.stringify(stableJson(activationB)) &&
      activationA.status === 'activated' &&
      activationA.eventId,
    'same-key activation race was not exactly idempotent',
  );
  const switched = runJson(
    `select jsonb_build_object('active',(select count(*) from platform_private.cms_content_type_versions where content_type_id=${sql(typeId)}::uuid and state='active'),'events',(select count(*) from platform_private.outbox_events where event_type='cms.schema.activated.v1' and payload->>'migrationPlanId'=${sql(planId)}),'compilerHash',(select artifact_hash from platform_private.cms_schema_artifacts where id=${sql(artifactId)}::uuid));`,
  );
  assert(
    switched.active === 1 &&
      switched.events === 1 &&
      switched.compilerHash === base.compilerHash,
    'activation race changed active/event cardinality or compiler provenance',
  );

  const eventId = activationA.eventId;
  const eventCommon = {
    eventId,
    eventType: 'cms.schema.activated.v1',
    schemaVersion: '1',
    aggregateType: 'cms_content_type_version',
    aggregateId: targetId,
    aggregateVersion: '2',
    migrationPlanId: planId,
  };
  const initialClaimToken = randomUUID();
  const eventClaim = call('cms_claim_schema_migration_event', {
    ...eventCommon,
    claimToken: initialClaimToken,
    replay: false,
  });
  assert(
    eventClaim.status === 'new',
    'production event claim did not reserve the activation event',
  );
  assert(
    call('cms_dead_letter_schema_migration_event', {
      ...eventCommon,
      claimToken: initialClaimToken,
      reasonCode: 'SIMULATED_WORKER_LOSS',
    }).accepted === true,
    'production DLQ RPC rejected the simulated failure',
  );
  const dlq = runJson(
    `select jsonb_build_object('eventType',event_type,'schemaVersion',schema_version::text,'aggregateId',aggregate_id::text,'aggregateVersion',aggregate_version::text,'deadLettered',dead_lettered_at is not null,'dispatched',dispatched_at is not null,'reason',dead_letter_reason,'errorCode',last_dispatch_error_code,'lease',dispatch_lease_token is null) from platform_private.outbox_events where id=${sql(eventId)}::uuid;`,
  );
  assert(
    dlq.eventType === 'cms.schema.activated.v1' &&
      dlq.schemaVersion === '1' &&
      dlq.aggregateId === targetId &&
      dlq.aggregateVersion === '2' &&
      dlq.deadLettered === true &&
      dlq.dispatched === true &&
      dlq.reason === 'SIMULATED_WORKER_LOSS' &&
      dlq.errorCode === 'SIMULATED_WORKER_LOSS' &&
      dlq.lease === true,
    'production DLQ did not persist the bound event identity and reason',
  );
  const replayTokens = [randomUUID(), randomUUID()];
  const replayRace = await Promise.allSettled(
    replayTokens.map((claimToken) =>
      callAsync('cms_claim_schema_migration_event', {
        ...eventCommon,
        claimToken,
        replay: true,
      }),
    ),
  );
  const replayStatuses = replayRace.map((result) =>
    result.status === 'fulfilled' ? result.value.status : 'rejected',
  );
  assert(
    [...replayStatuses].sort().join(',') === 'in_progress,replayable',
    'concurrent DLQ replay claims did not elect exactly one fenced owner',
  );
  const winningIndex = replayStatuses.indexOf('replayable');
  const replayClaimToken = replayTokens[winningIndex];
  assert(
    typeof replayClaimToken === 'string',
    'concurrent DLQ replay did not retain its winning fence token',
  );
  const acknowledgement = {
    ...eventCommon,
    claimToken: replayClaimToken,
    outcome: 'success',
  };
  const ackRace = await Promise.allSettled([
    callAsync('cms_acknowledge_schema_migration_event', acknowledgement),
    callAsync('cms_acknowledge_schema_migration_event', acknowledgement),
  ]);
  assert(
    ackRace.every(
      (result) =>
        result.status === 'fulfilled' && result.value.accepted === true,
    ),
    'concurrent replay acknowledgements were not idempotent',
  );
  const acknowledged = runJson(
    `select jsonb_build_object('claimState',(select state from platform_private.idempotency_records where actor_id=${sql(eventId)}::uuid and operation='cms.schema.event.claim' and key_hash=platform_private.cms_key_hash(${sql(eventId)})),'deadLettered',(select dead_lettered_at is not null from platform_private.outbox_events where id=${sql(eventId)}::uuid),'eventCount',(select count(*) from platform_private.outbox_events where id=${sql(eventId)}::uuid));`,
  );
  assert(
    acknowledged.claimState === 'completed' &&
      acknowledged.deadLettered === true &&
      acknowledged.eventCount === 1,
    'replay acknowledgement changed durable DLQ state or event cardinality',
  );
  const evidence = {
    sessions: 'committed-independent-psql',
    cursor: 0,
    recovery: 'expired-lease-takeover',
    activationRace: 'same-response-one-event',
    dlq: 'single-fenced-replay-owner',
  };
  console.log(JSON.stringify({ status: 'passed', evidence }));
};

main().catch((error) => {
  console.error(`AC217 independent-session harness failed: ${error.message}`);
  process.exitCode = 1;
});
