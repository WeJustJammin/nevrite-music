import { createHash } from 'node:crypto';

import {
  AC209_WORKER_NAME,
  Ac209ProviderStateSchema,
  type Ac209ProviderState,
} from './ac209-alert-configuration-contract.ts';
const CLOUDFLARE_ACCOUNT_ID = /^[0-9a-f]{32}$/u;
const WORKER_VERSION_ID = /^[0-9a-f-]{36}$/u;
type FetchImplementation = typeof fetch;
const fail = (message: string): never => {
  throw new Error(`AC209 provider configuration check failed: ${message}`);
};
const requireSecret = (value: string, name: string): void => {
  if (typeof value !== 'string' || value.length === 0)
    fail(`${name} is unavailable`);
};
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;
const requestCloudflareJson = async (
  fetchImpl: FetchImplementation,
  url: string,
  token: string,
  label: string,
): Promise<unknown> => {
  let response: Response | undefined;
  try {
    response = await fetchImpl(url, {
      headers: {
        accept: 'application/json',
        authorization: `Bearer ${token}`,
      },
    });
  } catch {
    fail(`${label} request failed`);
  }
  if (response === undefined || !response.ok) fail(`${label} request failed`);
  try {
    return await response.json();
  } catch {
    fail(`${label} response is not JSON`);
  }
};
const providerResult = (value: unknown, label: string): unknown => {
  if (!isRecord(value) || value.success !== true || !('result' in value))
    fail(`${label} response envelope is invalid`);
  return value['result'];
};
const readString = (value: unknown, label: string): string => {
  if (typeof value !== 'string') fail(`${label} is unavailable`);
  return value as string;
};
const normalizeBindings = (
  value: unknown,
): Array<{ name: string; type: string }> => {
  const entries = Array.isArray(value)
    ? value
    : fail('worker bindings response is unavailable');
  return entries.map((entry: unknown) => {
    if (!isRecord(entry)) fail('worker binding response is malformed');
    return {
      name: readString(entry.name, 'worker binding name'),
      type: readString(entry.type, 'worker binding type'),
    };
  });
};
const normalizeObservability = (value: unknown) => {
  const settings = isRecord(value)
    ? value
    : fail('worker settings response is malformed');
  const observability = isRecord(settings['observability'])
    ? settings['observability']
    : fail('worker observability response is malformed');
  const logs = isRecord(observability['logs'])
    ? observability['logs']
    : fail('worker observability logs response is malformed');
  return {
    enabled: observability['enabled'],
    headSamplingRate: observability['head_sampling_rate'],
    logs: {
      enabled: logs['enabled'],
      headSamplingRate: logs['head_sampling_rate'],
      invocationLogs: logs['invocation_logs'],
      persist: logs['persist'],
    },
  };
};
const normalizeVersion = (value: unknown, attestationValue: unknown) => {
  const version = isRecord(value)
    ? value
    : fail('worker version response is malformed');
  const attestation = isRecord(attestationValue)
    ? attestationValue
    : fail('worker version attestation is malformed');
  const versionId = readString(version['id'], 'worker version ID');
  if (
    readString(attestation['versionId'], 'worker attestation version ID') !==
    versionId
  )
    fail('worker version attestation identity does not match version detail');
  const resources = isRecord(version['resources'])
    ? version['resources']
    : fail('worker version resources are malformed');
  const rawBindings = Array.isArray(resources['bindings'])
    ? resources['bindings']
    : fail('worker version bindings are unavailable');
  const entries = rawBindings.map((entry: unknown) => {
    if (!isRecord(entry)) fail('worker version binding is malformed');
    return entry;
  });
  const bindings = normalizeBindings(entries);
  const metadata = isRecord(version['metadata'])
    ? version['metadata']
    : fail('worker version metadata is malformed');
  const plainText = new Map<string, string>();
  for (const entry of entries) {
    if (
      entry.type === 'plain_text' &&
      typeof entry.name === 'string' &&
      typeof entry.text === 'string'
    )
      plainText.set(entry.name, entry.text);
  }
  const queue = entries.find((entry) => entry.name === 'PLATFORM_JOBS');
  const email = entries.find((entry) => entry.name === 'PLATFORM_ALERT_EMAIL');
  if (queue === undefined || email === undefined)
    fail('worker target bindings are unavailable');
  const destination = readString(
    email['destination_address'],
    'worker alert destination',
  );
  return {
    versionId,
    versionSource: readString(metadata['source'], 'worker version source'),
    versionCreatedAt: readString(
      metadata['created_on'],
      'worker version timestamp',
    ),
    appEnvironment: plainText.get('APP_ENVIRONMENT') ?? '',
    appRelease: plainText.get('APP_RELEASE') ?? '',
    cloudflareAccountId: plainText.get('CLOUDFLARE_ACCOUNT_ID') ?? '',
    dlqId: plainText.get('CLOUDFLARE_PLATFORM_DLQ_ID') ?? '',
    supabaseUrl: plainText.get('SUPABASE_URL') ?? '',
    queueName: readString(queue['queue_name'], 'worker queue target'),
    alertEmailSha256: createHash('sha256').update(destination).digest('hex'),
    versionAnnotations: {
      tag: readString(attestation['tag'], 'worker version tag'),
      message: readString(attestation['message'], 'worker version message'),
      triggeredBy: readString(
        attestation['triggeredBy'],
        'worker version provenance',
      ),
    },
    bindings,
  };
};
const normalizeSchedules = (value: unknown) => {
  const schedules = isRecord(value) ? value['schedules'] : undefined;
  const entries = Array.isArray(schedules)
    ? schedules
    : fail('worker schedules response is malformed');
  return entries.map((entry: unknown) => {
    if (!isRecord(entry)) fail('worker schedule response is malformed');
    return { cron: readString(entry.cron, 'worker schedule cron') };
  });
};
const normalizeDeployments = (value: unknown) => {
  const deployments = isRecord(value) ? value['deployments'] : undefined;
  const entries = Array.isArray(deployments)
    ? deployments
    : fail('worker deployments response is malformed');
  return entries.map((entry: unknown) => {
    if (!isRecord(entry) || !Array.isArray(entry.versions))
      fail('worker deployment response is malformed');
    return {
      id: readString(entry.id, 'worker deployment ID'),
      source: readString(entry.source, 'worker deployment source'),
      strategy: readString(entry.strategy, 'worker deployment strategy'),
      createdAt: readString(entry.created_on, 'worker deployment timestamp'),
      annotations: {
        'workers/triggered_by': isRecord(entry.annotations)
          ? readString(
              entry.annotations['workers/triggered_by'],
              'worker deployment provenance',
            )
          : '',
      },
      versions: entry.versions.map((version: unknown) => {
        if (!isRecord(version)) fail('worker deployment version is malformed');
        return {
          id: readString(version.version_id, 'worker version ID'),
          percentage:
            typeof version.percentage === 'number' ? version.percentage : -1,
        };
      }),
    };
  });
};
export type CloudflareProviderReadInput = {
  accountId: string;
  providerToken: string;
  versionId: string;
  versionAttestation: unknown;
  fetchImpl?: FetchImplementation;
};
// Read only report-safe AC209 fields; raw provider bodies are discarded.
export const readAc209ProviderStateFromCloudflare = async ({
  accountId,
  providerToken,
  versionId,
  versionAttestation,
  fetchImpl = fetch,
}: CloudflareProviderReadInput): Promise<Ac209ProviderState> => {
  if (!CLOUDFLARE_ACCOUNT_ID.test(accountId))
    fail('Cloudflare account ID is invalid');
  if (!WORKER_VERSION_ID.test(versionId)) fail('worker version ID is invalid');
  requireSecret(providerToken, 'CLOUDFLARE_API_TOKEN');
  const base = `https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${AC209_WORKER_NAME}`;
  const [
    settingsResponse,
    schedulesResponse,
    deploymentsResponse,
    versionResponse,
  ] = await Promise.all([
    requestCloudflareJson(
      fetchImpl,
      `${base}/settings`,
      providerToken,
      'worker settings',
    ),
    requestCloudflareJson(
      fetchImpl,
      `${base}/schedules`,
      providerToken,
      'worker schedules',
    ),
    requestCloudflareJson(
      fetchImpl,
      `${base}/deployments`,
      providerToken,
      'worker deployments',
    ),
    requestCloudflareJson(
      fetchImpl,
      `${base}/versions/${encodeURIComponent(versionId)}`,
      providerToken,
      'worker version',
    ),
  ]);
  const settings = providerResult(settingsResponse, 'worker settings');
  const version = providerResult(versionResponse, 'worker version');
  const state = {
    workerName: AC209_WORKER_NAME,
    settings: normalizeVersion(version, versionAttestation),
    observability: normalizeObservability(settings),
    schedules: normalizeSchedules(
      providerResult(schedulesResponse, 'worker schedules'),
    ),
    deployments: normalizeDeployments(
      providerResult(deploymentsResponse, 'worker deployments'),
    ),
  };
  const parsed = Ac209ProviderStateSchema.safeParse(state);
  if (!parsed.success) fail('normalized provider configuration is malformed');
  if (parsed.data === undefined)
    fail('normalized provider configuration is unavailable');
  if (parsed.data.settings.versionId !== versionId)
    fail('worker version response identity does not match the request');
  return parsed.data;
};
