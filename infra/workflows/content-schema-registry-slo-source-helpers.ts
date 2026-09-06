const SOURCE_SHA_PATTERN = /^[0-9a-f]{40}$/u;
const DEPLOYMENT_ID_PATTERN = /^[1-9][0-9]*$/u;
const REPOSITORY_PATTERN = /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u;
const UTC_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;
const UTC_DAY_MS = 86_400_000;
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_BYTES = 1_000_000;

type JsonObject = Record<string, unknown>;

export type ContentSchemaRegistrySloSourceOptions = Readonly<{
  apiUrl: string;
  repository: string;
  token: string;
  productionDeploymentId: string;
  sourceRevision: string;
  utcDay: string;
  now?: () => number;
  timeoutMs?: number;
}>;

export type ContentSchemaRegistrySloSourceResult = Readonly<{
  windowStart: string;
  windowEnd: string;
  sourceRevision: string;
  deploymentId: string;
  productionDeployedAt: string;
  queryId: string;
}>;

export type ValidatedContentSchemaRegistrySloSourceOptions = Readonly<{
  base: URL;
  owner: string;
  name: string;
  deploymentNumber: number;
  windowStart: number;
  windowEnd: number;
  timeoutMs: number;
}>;

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const baseApiUrl = (apiUrl: string): URL => {
  let parsed: URL;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new Error('GITHUB_API_URL must be a valid HTTPS URL.');
  }
  if (
    parsed.protocol !== 'https:' ||
    parsed.search !== '' ||
    parsed.hash !== ''
  )
    throw new Error('GITHUB_API_URL must be a valid HTTPS URL.');
  parsed.pathname = parsed.pathname.endsWith('/')
    ? parsed.pathname
    : `${parsed.pathname}/`;
  return parsed;
};

const repositoryParts = (repository: string): readonly [string, string] => {
  if (!REPOSITORY_PATTERN.test(repository))
    throw new Error('GITHUB_REPOSITORY must identify an owner and repository.');
  const [owner, name] = repository.split('/');
  if (owner === undefined || name === undefined)
    throw new Error('GITHUB_REPOSITORY must identify an owner and repository.');
  return [owner, name];
};

export const endpointFor = (
  base: URL,
  owner: string,
  name: string,
  suffix: string,
): URL =>
  new URL(
    `repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/${suffix}`,
    base,
  );

const parseUtcDay = (utcDay: string): number => {
  if (!UTC_DAY_PATTERN.test(utcDay))
    throw new Error('UTC day must use the YYYY-MM-DD format.');
  const start = Date.parse(`${utcDay}T00:00:00.000Z`);
  if (
    !Number.isFinite(start) ||
    new Date(start).toISOString().slice(0, 10) !== utcDay
  )
    throw new Error('UTC day is not a valid calendar date.');
  return start;
};

const parseTimestamp = (value: unknown, label: string): number => {
  if (typeof value !== 'string')
    throw new Error(`${label} timestamp is invalid.`);
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp))
    throw new Error(`${label} timestamp is invalid.`);
  return timestamp;
};

const responseTooLarge = 'GitHub API response is too large.';

type ResponseTextResult =
  | Readonly<{ readonly ok: true; readonly text: string }>
  | Readonly<{
      readonly ok: false;
      readonly reason: 'too-large' | 'read-failed';
    }>;

const readResponseText = async (
  response: Response,
): Promise<ResponseTextResult> => {
  const reader = response.body?.getReader();
  if (reader === undefined) {
    try {
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_RESPONSE_BYTES)
        return { ok: false, reason: 'too-large' };
      return { ok: true, text };
    } catch {
      return { ok: false, reason: 'read-failed' };
    }
  }

  const decoder = new TextDecoder();
  let bytes = 0;
  let text = '';
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_RESPONSE_BYTES) {
        try {
          await reader.cancel();
        } catch {
          // The bounded-response failure remains the safe, actionable result.
        }
        return { ok: false, reason: 'too-large' };
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    return { ok: true, text: text + decoder.decode() };
  } catch {
    return { ok: false, reason: 'read-failed' };
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // Keep response-reader cleanup failures secret-safe and generic.
    }
  }
};

export const requestJson = async (
  endpoint: URL,
  token: string,
  fetchImpl: typeof fetch,
  timeoutMs: number,
  label: string,
): Promise<unknown> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response: Response;
    try {
      response = await fetchImpl(endpoint.toString(), {
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'X-GitHub-Api-Version': '2022-11-28',
        },
        method: 'GET',
        signal: controller.signal,
      });
    } catch {
      throw new Error(`GitHub ${label} API request failed.`);
    }

    if (!response.ok)
      throw new Error(`GitHub ${label} API returned HTTP ${response.status}.`);

    const responseText = await readResponseText(response);
    if (!responseText.ok) {
      if (responseText.reason === 'too-large')
        throw new Error(responseTooLarge);
      throw new Error(`GitHub ${label} API returned invalid JSON.`);
    }
    try {
      return JSON.parse(responseText.text) as unknown;
    } catch {
      throw new Error(`GitHub ${label} API returned invalid JSON.`);
    }
  } finally {
    clearTimeout(timeout);
  }
};

export const validateOptions = (
  options: ContentSchemaRegistrySloSourceOptions,
): ValidatedContentSchemaRegistrySloSourceOptions => {
  const base = baseApiUrl(options.apiUrl);
  const [owner, name] = repositoryParts(options.repository);
  if (!DEPLOYMENT_ID_PATTERN.test(options.productionDeploymentId))
    throw new Error('Production deployment ID must be numeric.');
  const deploymentNumber = Number(options.productionDeploymentId);
  if (!Number.isSafeInteger(deploymentNumber) || deploymentNumber <= 0)
    throw new Error('Production deployment ID must be a safe integer.');
  if (!SOURCE_SHA_PATTERN.test(options.sourceRevision))
    throw new Error('Source revision must be a full lowercase commit SHA.');
  if (options.token.length === 0 || /\s/u.test(options.token))
    throw new Error('A GitHub token is required for SLO source preflight.');

  const windowStart = parseUtcDay(options.utcDay);
  const windowEnd = windowStart + UTC_DAY_MS;
  const now = options.now?.() ?? Date.now();
  if (!Number.isFinite(now))
    throw new Error('Trusted current time is invalid.');
  if (windowEnd > now) throw new Error('The requested UTC day has not ended.');

  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  if (!Number.isSafeInteger(timeoutMs) || timeoutMs <= 0)
    throw new Error('GitHub API timeout must be a positive safe integer.');

  return {
    base,
    owner,
    name,
    deploymentNumber,
    windowStart,
    windowEnd,
    timeoutMs,
  };
};

export const verifyDeployment = (
  value: unknown,
  deploymentNumber: number,
  sourceRevision: string,
): JsonObject => {
  if (!isJsonObject(value))
    throw new Error('GitHub deployment response is invalid.');
  if (
    value.id !== deploymentNumber ||
    value.environment !== 'production' ||
    value.sha !== sourceRevision
  )
    throw new Error(
      'Production deployment identity does not match the requested source.',
    );
  return value;
};

const statusTimestamp = (status: JsonObject): number => {
  if (status.created_at !== undefined)
    return parseTimestamp(status.created_at, 'Deployment status');
  return parseTimestamp(status.updated_at, 'Deployment status');
};

export const verifySuccessfulStatus = (
  value: unknown,
): { readonly timestamp: number; readonly status: JsonObject } => {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error('GitHub deployment statuses response is invalid.');
  let latest:
    { readonly timestamp: number; readonly status: JsonObject } | undefined;
  for (const candidate of value) {
    if (!isJsonObject(candidate))
      throw new Error('GitHub deployment statuses response is invalid.');
    const timestamp = statusTimestamp(candidate);
    if (latest === undefined || timestamp > latest.timestamp)
      latest = { timestamp, status: candidate };
  }
  if (latest === undefined || latest.status.state !== 'success')
    throw new Error('A successful production deployment status is required.');
  if (latest.status.environment !== 'production')
    throw new Error('The successful deployment status is not production.');
  return latest;
};
