import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export interface CloudflareObservabilityVerificationConfig {
  readonly accountId: string;
  readonly token: string;
}

const CLOUDFLARE_ACCOUNT_ID = /^[0-9a-f]{32}$/u;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const verificationError = (message: string, detail: string): Error =>
  new Error(`${message}: ${detail}`);

const requestJson = async (
  fetchImpl: typeof fetch,
  url: string,
  token: string,
  body: Readonly<Record<string, unknown>>,
  failureMessage: string,
): Promise<unknown> => {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      body: JSON.stringify(body),
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
  } catch {
    throw verificationError(failureMessage, 'request failed');
  }
  if (!response.ok)
    throw verificationError(failureMessage, `HTTP ${response.status}`);
  try {
    return await response.json();
  } catch {
    throw verificationError(failureMessage, 'invalid JSON response');
  }
};

const classifyGraphqlErrors = (errors: unknown[]): string => {
  const messages = errors
    .map((error) => (isRecord(error) ? error.message : undefined))
    .filter((message): message is string => typeof message === 'string');
  if (
    messages.some((message) =>
      /not found|does not exist|unknown (?:account|resource)/iu.test(message),
    )
  )
    return 'GraphQL resource error';
  if (
    messages.some((message) =>
      /unauthorized|not authorized|forbidden|permission|access|denied/iu.test(
        message,
      ),
    )
  )
    return 'GraphQL permission error';
  return 'GraphQL error';
};

export const verifyCloudflareObservabilityToken = async (
  config: CloudflareObservabilityVerificationConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<void> => {
  if (!CLOUDFLARE_ACCOUNT_ID.test(config.accountId))
    throw new Error(
      'Cloudflare account ID must be 32 lowercase hex characters',
    );
  if (config.token.length < 20 || /\s/u.test(config.token))
    throw new Error('Cloudflare observability token is malformed');

  const to = Date.now();
  const headersFailure =
    'Cloudflare Workers Observability permission check failed';
  const logsPayload = await requestJson(
    fetchImpl,
    `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/workers/observability/telemetry/query`,
    config.token,
    {
      parameters: {
        datasets: ['cloudflare-workers'],
        limit: 1,
        needle: { isRegex: false, value: 'cms.registry.' },
        view: 'events',
      },
      queryId: 'wejammin-production-observability-preflight',
      timeframe: { from: to - 300_000, to },
    },
    headersFailure,
  );
  if (
    !isRecord(logsPayload) ||
    logsPayload.success !== true ||
    !isRecord(logsPayload.result)
  )
    throw new Error(headersFailure);

  const analyticsFailure =
    'Cloudflare Account Analytics permission check failed';
  const end = new Date(to).toISOString();
  const start = new Date(to - 300_000).toISOString();
  const analyticsPayload = await requestJson(
    fetchImpl,
    'https://api.cloudflare.com/client/v4/graphql',
    config.token,
    {
      query:
        'query QueueAnalyticsPermission($accountTag: string!, $datetimeStart: Time!, $datetimeEnd: Time!) { viewer { accounts(filter: { accountTag: $accountTag }) { queueBacklogAdaptiveGroups(limit: 1, filter: { datetime_geq: $datetimeStart, datetime_leq: $datetimeEnd }) { avg { messages } } } } }',
      variables: {
        accountTag: config.accountId,
        datetimeEnd: end,
        datetimeStart: start,
      },
    },
    analyticsFailure,
  );
  if (!isRecord(analyticsPayload))
    throw verificationError(analyticsFailure, 'invalid response envelope');
  if (
    Object.hasOwn(analyticsPayload, 'errors') &&
    analyticsPayload.errors !== null &&
    !Array.isArray(analyticsPayload.errors)
  )
    throw verificationError(analyticsFailure, 'invalid errors envelope');
  if (
    Array.isArray(analyticsPayload.errors) &&
    analyticsPayload.errors.length > 0
  )
    throw verificationError(
      analyticsFailure,
      classifyGraphqlErrors(analyticsPayload.errors),
    );
  const data = analyticsPayload.data;
  if (!isRecord(data))
    throw verificationError(analyticsFailure, 'missing data envelope');
  const viewer = data.viewer;
  if (!isRecord(viewer))
    throw verificationError(analyticsFailure, 'missing viewer envelope');
  const accounts = viewer.accounts;
  if (!Array.isArray(accounts))
    throw verificationError(analyticsFailure, 'missing accounts envelope');
  if (accounts.length === 0)
    throw verificationError(analyticsFailure, 'GraphQL resource error');
  const account = accounts[0];
  if (!isRecord(account))
    throw verificationError(analyticsFailure, 'malformed account envelope');
  if (!Array.isArray(account.queueBacklogAdaptiveGroups))
    throw verificationError(
      analyticsFailure,
      'queue analytics field unavailable',
    );
};

const run = async (): Promise<void> => {
  const accountId = process.env['CLOUDFLARE_ACCOUNT_ID'] ?? '';
  const token = process.env['CLOUDFLARE_OBSERVABILITY_API_TOKEN'] ?? '';
  await verifyCloudflareObservabilityToken({ accountId, token });
  console.log('Cloudflare observability token permissions verified.');
};

const entrypoint = process.argv[1];
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  run().catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Verification failed';
    console.error(`::error::${message}`);
    process.exitCode = 1;
  });
}
