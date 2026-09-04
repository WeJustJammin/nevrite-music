import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { HealthResponseSchema } from '../packages/contracts/src/index.ts';

const expectedTitle = '<title>WeJammin | Operational foundation</title>';
const expectedHeadingPattern =
  /<h1(?:\s[^>]*)?>WeJammin operational foundation<\/h1>/iu;
const expectedContentSecurityPolicy =
  "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-{nonce}' 'strict-dynamic'; style-src 'self' 'nonce-{nonce}'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.provider-native diagnostics.io; frame-src 'none'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests; report-to csp-endpoint";

const expectedStaticSecurityHeaders = {
  'strict-transport-security': 'max-age=63072000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy':
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), publickey-credentials-get=(self)',
};

const noncePattern = /'nonce-([A-Za-z0-9_-]{22})'/u;
const staticAssetPattern = /\b(?:src|href)=["'](\/[^"']+)["']/gu;
const defaultRetryAttempts = 5;
const defaultRetryDelayMs = 3_000;

const sleep = (delayMs) =>
  new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });

function parseOrigin(value, label) {
  const url = new URL(value);

  if (url.protocol !== 'https:') {
    throw new Error('Staging origins must use HTTPS');
  }

  if (url.pathname !== '/' || url.search || url.hash) {
    throw new Error(
      `${label} must be an origin without a path, query, or hash`,
    );
  }

  return url.origin;
}

function assertOk(response, label) {
  if (response.status !== 200) {
    throw new Error(`${label} returned HTTP ${response.status}`);
  }
}

function assertSecurityHeaders(response, label) {
  const contentSecurityPolicy = response.headers.get('content-security-policy');
  const nonce = contentSecurityPolicy?.match(noncePattern)?.[1];
  const expectedPolicy = nonce
    ? expectedContentSecurityPolicy.replaceAll('{nonce}', nonce)
    : undefined;

  if (
    !contentSecurityPolicy ||
    !nonce ||
    contentSecurityPolicy !== expectedPolicy
  ) {
    throw new Error(
      `${label} security header content-security-policy mismatch`,
    );
  }

  for (const [name, expected] of Object.entries(
    expectedStaticSecurityHeaders,
  )) {
    if (response.headers.get(name) !== expected) {
      throw new Error(`${label} security header ${name} mismatch`);
    }
  }
}

function discoverStaticAssetPath(html) {
  for (const match of html.matchAll(staticAssetPattern)) {
    const candidate = match[1];
    if (!candidate) continue;

    const url = new URL(candidate, 'https://staging.invalid');
    if (
      url.pathname.startsWith('/_astro/') ||
      url.pathname === '/favicon.svg'
    ) {
      return `${url.pathname}${url.search}`;
    }
  }

  return undefined;
}

function toHttpOrigin(origin) {
  const url = new URL(origin);
  url.protocol = 'http:';
  return url.origin;
}

async function assertHttpsRedirect(fetchImpl, url, expectedLocation, label) {
  const response = await fetchImpl(url, {
    headers: { accept: 'application/json, text/html;q=0.9' },
    redirect: 'manual',
    signal: AbortSignal.timeout(10_000),
  });

  if (response.status !== 301 && response.status !== 308) {
    throw new Error(`${label} HTTP redirect must be permanent`);
  }

  if (response.headers.get('location') !== expectedLocation) {
    throw new Error(`${label} HTTP redirect location mismatch`);
  }

  assertSecurityHeaders(response, `${label} HTTP redirect`);
}

export async function verifyStaging({
  apiOrigin,
  fetchImpl = fetch,
  webOrigin,
}) {
  const webUrl = parseOrigin(webOrigin, 'Web origin');
  const apiUrl = parseOrigin(apiOrigin, 'API origin');
  const requestOptions = {
    headers: { accept: 'application/json, text/html;q=0.9' },
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  };

  const webResponse = await fetchImpl(`${webUrl}/`, requestOptions);
  assertOk(webResponse, 'Staging web');
  assertSecurityHeaders(webResponse, 'Staging web');

  const contentType = webResponse.headers.get('content-type') ?? '';
  const html = await webResponse.text();
  if (
    !contentType.startsWith('text/html') ||
    !html.includes(expectedTitle) ||
    !expectedHeadingPattern.test(html)
  ) {
    throw new Error('Web shell contract mismatch');
  }

  const webRuntimeResponse = await fetchImpl(`${webUrl}/app/infrastructure`, {
    ...requestOptions,
    headers: { accept: 'text/html' },
    redirect: 'manual',
  });
  if (
    webRuntimeResponse.status !== 303 ||
    webRuntimeResponse.headers.get('location') !==
      '/auth/sign-in?returnTo=%2Fapp%2Finfrastructure'
  ) {
    throw new Error('Web SSR boundary mismatch');
  }
  assertSecurityHeaders(webRuntimeResponse, 'Staging web runtime');

  const apiResponse = await fetchImpl(
    `${apiUrl}/api/v1/health`,
    requestOptions,
  );
  assertOk(apiResponse, 'Staging API');
  assertSecurityHeaders(apiResponse, 'Staging API');

  const health = HealthResponseSchema.safeParse(await apiResponse.json());
  if (!health.success) {
    throw new Error('API health contract mismatch');
  }

  const staticAssetPath = discoverStaticAssetPath(html);
  if (!staticAssetPath) {
    throw new Error('Staging web static asset discovery mismatch');
  }

  const staticAssetResponse = await fetchImpl(`${webUrl}${staticAssetPath}`, {
    headers: { accept: '*/*' },
    redirect: 'error',
    signal: AbortSignal.timeout(10_000),
  });
  assertOk(staticAssetResponse, 'Staging static web asset');
  assertSecurityHeaders(staticAssetResponse, 'Staging static web asset');

  await assertHttpsRedirect(
    fetchImpl,
    `${toHttpOrigin(webUrl)}/`,
    `${webUrl}/`,
    'Staging web',
  );
  await assertHttpsRedirect(
    fetchImpl,
    `${toHttpOrigin(apiUrl)}/api/v1/health`,
    `${apiUrl}/api/v1/health`,
    'Staging API',
  );

  return {
    apiStatus: apiResponse.status,
    webRuntimeStatus: webRuntimeResponse.status,
    webStatus: webResponse.status,
  };
}

export async function verifyStagingWithRetries({
  attempts = defaultRetryAttempts,
  delayMs = defaultRetryDelayMs,
  sleepImpl = sleep,
  ...verificationOptions
}) {
  if (!Number.isInteger(attempts) || attempts < 1) {
    throw new Error('Staging verification attempts must be a positive integer');
  }

  if (!Number.isFinite(delayMs) || delayMs < 0) {
    throw new Error('Staging verification retry delay must be non-negative');
  }

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await verifyStaging(verificationOptions);
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }

      await sleepImpl(delayMs);
    }
  }

  throw new Error('Staging verification exhausted without a result');
}

async function main() {
  const result = await verifyStagingWithRetries({
    apiOrigin: process.env.STAGING_API_ORIGIN,
    webOrigin: process.env.STAGING_WEB_ORIGIN,
  });
  console.log(JSON.stringify(result));
}

const entrypoint = process.argv[1]
  ? pathToFileURL(realpathSync(process.argv[1])).href
  : undefined;

if (entrypoint === import.meta.url) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Verification failed',
    );
    process.exitCode = 1;
  });
}
