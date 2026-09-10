import {
  AC209_REQUIRED_BINDINGS,
  Ac209ProviderStateSchema,
  type Ac209ProviderState,
} from './ac209-alert-configuration-contract.ts';

export type Ac209ProviderExpectation = {
  accountId: string;
  sourceRevision: string;
  productionDeploymentId: string;
  productionVersionId: string;
  expectedDlqId: string;
  expectedSupabaseUrl: string;
  expectedAlertEmailSha256: string;
};

const fail = (message: string): never => {
  throw new Error(`AC209 configuration check failed: ${message}`);
};

export const assertAc209ProviderState = (
  value: unknown,
  input: Ac209ProviderExpectation,
): Ac209ProviderState => {
  const parsed = Ac209ProviderStateSchema.safeParse(value);
  if (!parsed.success || parsed.data === undefined)
    fail('provider configuration response is malformed');
  const state = parsed.data;
  if (state.settings.versionId !== input.productionVersionId)
    fail('version-specific settings do not match the requested version');
  if (state.settings.cloudflareAccountId !== input.accountId)
    fail('account binding does not match the requested account');
  if (state.settings.appRelease !== input.sourceRevision)
    fail('APP_RELEASE does not match the requested source revision');
  if (state.settings.dlqId !== input.expectedDlqId)
    fail('CLOUDFLARE_PLATFORM_DLQ_ID does not match the expected DLQ');
  if (state.settings.supabaseUrl !== input.expectedSupabaseUrl)
    fail('SUPABASE_URL does not match the approved production target');
  if (state.settings.queueName !== 'platform-jobs')
    fail('queue binding does not target platform-jobs');
  if (state.settings.alertEmailSha256 !== input.expectedAlertEmailSha256)
    fail('alert destination does not match the approved digest');
  const bindingByName = new Map(
    state.settings.bindings.map((binding) => [binding.name, binding.type]),
  );
  for (const expected of AC209_REQUIRED_BINDINGS) {
    if (bindingByName.get(expected.name) !== expected.type)
      fail(`binding ${expected.name} is missing or has the wrong type`);
  }
  if (state.schedules.length !== 1 || state.schedules[0]?.cron !== '* * * * *')
    fail('production schedule is not the locked every-minute boundary');
  const deployment = state.deployments[0];
  if (deployment === undefined) fail('production deployment is unavailable');
  if (deployment.id !== input.productionDeploymentId)
    fail('requested deployment is not the current first active deployment');
  if (
    deployment.source !== 'wrangler' ||
    deployment.strategy !== 'percentage' ||
    deployment.annotations['workers/triggered_by'] !== 'deployment' ||
    deployment.versions.length !== 1 ||
    deployment.versions[0]?.id !== input.productionVersionId ||
    deployment.versions[0]?.percentage !== 100
  )
    fail('production version is not the exact 100% version');
  if (state.settings.versionAnnotations.tag !== input.sourceRevision)
    fail('version workers/tag does not match the requested source revision');
  if (
    !new RegExp(
      `^sourceRevision=${input.sourceRevision};githubRunId=[1-9][0-9]*$`,
    ).test(state.settings.versionAnnotations.message)
  )
    fail('version workers/message does not bind the requested source revision');
  return state;
};
