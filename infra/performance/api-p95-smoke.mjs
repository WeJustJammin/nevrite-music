import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repositoryRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../..',
);
const DEFAULT_ARTIFACT_PATH = resolve(
  repositoryRoot,
  'apps/worker/dist/index.js',
);
const DEFAULT_ORIGIN = 'http://127.0.0.1:8787';
const FIXTURE_REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const FIXTURE_CORRELATION_ID = '22222222-2222-4222-8222-222222222222';

/**
 * The Phase 1 profile deliberately exercises the dependency-free health
 * boundary. It is the Tier 0 API exit criterion from the architecture; the
 * representative-data k6/pgbench profile remains a later data-bearing gate.
 */
export const PHASE_1_P95_PROFILE = Object.freeze({
  id: 'phase-1-api-p95-smoke',
  fixtureVersion: 'phase-1-2026-08-31',
  iterations: 20,
  retries: 0,
  route: Object.freeze({
    method: 'GET',
    path: '/api/v1/health',
    expectedStatus: 200,
    headers: Object.freeze({
      accept: 'application/json',
      'x-correlation-id': FIXTURE_CORRELATION_ID,
      'x-request-id': FIXTURE_REQUEST_ID,
    }),
    expectedBody: Object.freeze({
      requestId: FIXTURE_REQUEST_ID,
      service: 'wejammin-api',
      version: 'v1',
      status: 'ok',
    }),
  }),
  thresholds: Object.freeze({ p95Ms: 500 }),
  virtualUsers: 1,
});

const resolveSourceRevision = () => {
  const configuredRevision =
    process.env.SOURCE_REVISION ?? process.env.GITHUB_SHA;
  const sourceRevision =
    configuredRevision ??
    execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd: repositoryRoot,
      encoding: 'utf8',
    }).trim();
  if (!/^[a-f0-9]{40}$/.test(sourceRevision))
    throw new Error('SOURCE_REVISION must be a full lowercase commit SHA');
  return sourceRevision;
};

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const errorMessage = (error) =>
  error instanceof Error ? error.message : 'Unknown smoke failure';

const validateProfile = (profile) => {
  if (!isRecord(profile))
    throw new TypeError('Smoke profile must be an object');
  if (profile.iterations !== 20)
    throw new Error('Phase 1 p95 smoke requires exactly 20 iterations');
  if (profile.virtualUsers !== 1)
    throw new Error('Phase 1 p95 smoke requires exactly one virtual user');
  if (profile.retries !== 0)
    throw new Error('Phase 1 p95 smoke forbids retries');
  if (!isRecord(profile.route) || profile.route.method !== 'GET')
    throw new Error('Phase 1 p95 smoke profile has an invalid route');
  if (
    !isRecord(profile.thresholds) ||
    typeof profile.thresholds.p95Ms !== 'number' ||
    !Number.isFinite(profile.thresholds.p95Ms) ||
    profile.thresholds.p95Ms < 0
  )
    throw new Error('Phase 1 p95 smoke profile has an invalid p95 threshold');
};

/**
 * Return the nearest-rank percentile. Nearest-rank is intentional for a
 * twenty-sample smoke: each reported percentile is an observed request and
 * cannot be manufactured by interpolation.
 */
export const percentile = (samples, rank) => {
  if (!Array.isArray(samples) || samples.length === 0)
    throw new RangeError('At least one timing sample is required');
  if (!Number.isFinite(rank) || rank < 0 || rank > 100)
    throw new RangeError('Percentile rank must be between 0 and 100');

  const sorted = [...samples].sort((left, right) => left - right);
  if (
    sorted.some(
      (sample) => typeof sample !== 'number' || !Number.isFinite(sample),
    )
  )
    throw new TypeError('Timing samples must be finite numbers');

  const nearestRank = Math.max(1, Math.ceil((rank / 100) * sorted.length));
  return sorted[nearestRank - 1];
};

const stableValue = (value) => {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

const validateSmokeResponse = async (response, route) => {
  if (!response || typeof response.status !== 'number')
    throw new Error('Smoke requester returned no HTTP response');
  if (response.status !== route.expectedStatus)
    throw new Error(
      `Expected HTTP ${route.expectedStatus}, received ${response.status}`,
    );

  const contentType = response.headers?.get('content-type') ?? '';
  if (!contentType.toLowerCase().startsWith('application/json'))
    throw new Error('Health response is not application/json');

  const payload = await response.json();
  if (stableValue(payload) !== stableValue(route.expectedBody))
    throw new Error('Health response contract mismatch');
};

const defaultClock = () => globalThis.performance?.now?.() ?? Date.now();

const requestForRoute = (route, baseOrigin) =>
  new Request(new URL(route.path, baseOrigin).href, {
    method: route.method,
    headers: route.headers,
  });

/**
 * Run one virtual user through twenty sequential requests. The requester is
 * awaited inside the loop, so there is no concurrency and no hidden retry.
 */
export const runApiP95Smoke = async ({
  clock = defaultClock,
  profile = PHASE_1_P95_PROFILE,
  requester,
  baseOrigin = DEFAULT_ORIGIN,
}) => {
  validateProfile(profile);
  if (typeof requester !== 'function')
    throw new TypeError('A smoke requester function is required');

  const samples = [];
  let errors = 0;
  for (let iteration = 0; iteration < profile.iterations; iteration += 1) {
    const startedAt = clock();
    try {
      const response = await requester(
        requestForRoute(profile.route, baseOrigin),
      );
      await validateSmokeResponse(response, profile.route);
    } catch {
      errors += 1;
    } finally {
      const elapsed = clock() - startedAt;
      samples.push(
        Number.isFinite(elapsed) && elapsed >= 0
          ? elapsed
          : Number.MAX_SAFE_INTEGER,
      );
    }
  }

  const p50Ms = percentile(samples, 50);
  const p95Ms = percentile(samples, 95);
  const p99Ms = percentile(samples, 99);
  const thresholdFailures = [];
  if (p95Ms >= profile.thresholds.p95Ms)
    thresholdFailures.push(
      `p95Ms=${p95Ms}ms must be <${profile.thresholds.p95Ms}ms`,
    );

  return Object.freeze({
    errors,
    p50Ms,
    p95Ms,
    p99Ms,
    passed: errors === 0 && thresholdFailures.length === 0,
    samples: samples.length,
    thresholdFailures: Object.freeze(thresholdFailures),
  });
};

const parseOrigin = (value, requireHttps) => {
  if (typeof value !== 'string' || value.trim() === '')
    throw new Error('API p95 smoke origin is required');
  const origin = new URL(value);
  if (
    (requireHttps && origin.protocol !== 'https:') ||
    (!requireHttps && !['http:', 'https:'].includes(origin.protocol))
  )
    throw new Error(
      requireHttps
        ? 'Staging API p95 smoke origin must use HTTPS'
        : 'API p95 smoke origin must use HTTP(S)',
    );
  if (origin.pathname !== '/' || origin.search || origin.hash)
    throw new Error('API p95 smoke origin must not include a path or query');
  return origin.origin;
};

/** Build a no-redirect, no-retry requester for a staging origin. */
export const createOriginRequester = (origin, fetchImpl = globalThis.fetch) => {
  const parsedOrigin = parseOrigin(origin, true);
  if (typeof fetchImpl !== 'function') throw new TypeError('fetch is required');
  return (request) => {
    const requestUrl = new URL(request.url);
    const targetUrl = new URL(
      `${requestUrl.pathname}${requestUrl.search}`,
      parsedOrigin,
    );
    return fetchImpl(targetUrl.href, {
      headers: request.headers,
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
  };
};

/**
 * Load the immutable Wrangler production bundle and expose only its Fetch
 * handler to the smoke runner. Local fixtures stay dependency-free because
 * the health route does not contact Supabase or Queue bindings.
 */
export const createProductionBuildRequester = async ({
  artifactPath = DEFAULT_ARTIFACT_PATH,
  environment = {
    APP_ENVIRONMENT: 'development',
    APP_RELEASE: 'phase-1-2026-08-31',
    SUPABASE_SECRET_KEY: 'synthetic-local-secret',
    SUPABASE_URL: 'http://127.0.0.1:54321',
  },
}) => {
  const resolvedArtifact = resolve(repositoryRoot, artifactPath);
  if (!existsSync(resolvedArtifact))
    throw new Error(
      `Production Worker artifact does not exist: ${resolvedArtifact}`,
    );

  const imported = await import(pathToFileURL(resolvedArtifact).href);
  const handler = imported.default;
  if (!handler || typeof handler.fetch !== 'function')
    throw new Error(
      'Production Worker artifact does not export a Fetch handler',
    );

  return (request) =>
    handler.fetch(request, environment, {
      waitUntil: () => {},
      passThroughOnException: () => {},
    });
};

export const sha256File = (filePath) =>
  createHash('sha256').update(readFileSync(filePath)).digest('hex');

/** Format the exact machine-readable smoke summary. */
export const formatSmokeEvidence = (result, metadata) =>
  JSON.stringify(metadata === undefined ? result : { ...metadata, ...result });

const parseArguments = (arguments_) => {
  const options = {
    artifactPath: process.env.API_P95_SMOKE_ARTIFACT ?? DEFAULT_ARTIFACT_PATH,
    mode: process.env.API_P95_SMOKE_MODE ?? 'local',
    origin:
      process.env.API_P95_SMOKE_ORIGIN ??
      process.env.STAGING_API_ORIGIN ??
      null,
  };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === '--mode') options.mode = arguments_[++index];
    else if (argument === '--origin') options.origin = arguments_[++index];
    else if (argument === '--artifact')
      options.artifactPath = arguments_[++index];
    else if (argument === '--help') options.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }
  return options;
};

const runCli = async () => {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    console.log(
      'Usage: node infra/performance/api-p95-smoke.mjs [--mode local|staging] [--origin https://staging-api.example] [--artifact apps/worker/dist/index.js]',
    );
    return;
  }

  let requester;
  let metadata = {
    fixtureVersion: PHASE_1_P95_PROFILE.fixtureVersion,
    iterations: PHASE_1_P95_PROFILE.iterations,
    profile: PHASE_1_P95_PROFILE.id,
    retries: PHASE_1_P95_PROFILE.retries,
    sourceRevision: resolveSourceRevision(),
    thresholds: PHASE_1_P95_PROFILE.thresholds,
    virtualUsers: PHASE_1_P95_PROFILE.virtualUsers,
  };
  if (options.mode === 'local') {
    const resolvedArtifact = resolve(repositoryRoot, options.artifactPath);
    requester = await createProductionBuildRequester({
      artifactPath: resolvedArtifact,
      environment: {
        APP_ENVIRONMENT: 'development',
        APP_RELEASE: 'phase-1-2026-08-31',
        SUPABASE_SECRET_KEY: 'synthetic-local-secret',
        SUPABASE_URL: 'http://127.0.0.1:54321',
      },
    });
    metadata = {
      ...metadata,
      artifactPath: relative(repositoryRoot, resolvedArtifact),
      artifactSha256: sha256File(resolvedArtifact),
      mode: 'local',
    };
  } else if (options.mode === 'staging') {
    const origin = parseOrigin(options.origin, true);
    requester = createOriginRequester(origin);
    metadata = { ...metadata, mode: 'staging', origin };
  } else {
    throw new Error(`Unsupported API p95 smoke mode: ${options.mode}`);
  }

  const originalConsoleInfo = console.info;
  let result;
  try {
    // The Worker emits sampled structured logs through console.info. Keep the
    // command's stdout a single machine-readable evidence line.
    console.info = () => {};
    result = await runApiP95Smoke({
      requester,
      profile: PHASE_1_P95_PROFILE,
    });
  } finally {
    console.info = originalConsoleInfo;
  }
  console.log(formatSmokeEvidence(result, metadata));
  if (!result.passed) process.exitCode = 1;
};

const entrypoint = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;
if (entrypoint === import.meta.url) {
  runCli().catch((error) => {
    console.error(errorMessage(error));
    process.exitCode = 1;
  });
}
