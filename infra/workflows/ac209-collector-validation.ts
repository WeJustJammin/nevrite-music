import {
  AC209_REQUIRED_BINDINGS,
  Ac209ProviderStateSchema,
  type Ac209ProviderState,
} from './ac209-alert-configuration-contract.ts';

export type Ac209ProviderExpectation = {
  accountId: string;
  sourceRevision: string;
  productionVersionId: string;
  expectedDlqId: string;
  expectedSupabaseUrl: string;
  expectedAlertEmailSha256: string;
};

export type ValidatedAc209ProviderState = {
  state: Ac209ProviderState;
  activeDeployment: Ac209ProviderState['deployments'][number];
};

const fail = (message: string): never => {
  throw new Error(`AC209 configuration check failed: ${message}`);
};

export const assertAc209ProviderState = (
  value: unknown,
  input: Ac209ProviderExpectation,
): ValidatedAc209ProviderState => {
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
  if (state.settings.versionAnnotations.tag !== input.sourceRevision)
    fail('version workers/tag does not match the requested source revision');
  if (
    !new RegExp(
      `^sourceRevision=${input.sourceRevision};githubRunId=[1-9][0-9]*$`,
    ).test(state.settings.versionAnnotations.message)
  )
    fail('version workers/message does not bind the requested source revision');
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
  const matchingDeployments = state.deployments.filter((candidate) =>
    candidate.versions.some(
      (version) => version.id === input.productionVersionId,
    ),
  );
  if (matchingDeployments.length === 0)
    fail('requested version is not present in a provider deployment');
  if (matchingDeployments.length > 1)
    fail('requested version maps to multiple deployments');
  const activeDeployment = state.deployments[0];
  if (activeDeployment === undefined)
    fail('production active deployment is unavailable');
  if (matchingDeployments[0]?.id !== activeDeployment.id)
    fail('requested version is not the current active deployment');
  if (activeDeployment.versions.length !== 1)
    fail('active deployment must contain only the requested version');
  if (
    activeDeployment.source !== 'wrangler' ||
    activeDeployment.strategy !== 'percentage' ||
    activeDeployment.annotations['workers/triggered_by'] !== 'deployment' ||
    activeDeployment.versions[0]?.id !== input.productionVersionId ||
    activeDeployment.versions[0]?.percentage !== 100
  )
    fail('active deployment is not the exact 100% version');
  return { state, activeDeployment };
};
