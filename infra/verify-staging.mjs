import { pathToFileURL } from 'node:url';

import { HealthResponseSchema } from '../packages/contracts/src/index.ts';

const expectedTitle = '<title>WeJammin | Operational foundation</title>';
const expectedHeading = '<h1>WeJammin operational foundation</h1>';

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

  const contentType = webResponse.headers.get('content-type') ?? '';
  const html = await webResponse.text();
  if (
    !contentType.startsWith('text/html') ||
    !html.includes(expectedTitle) ||
    !html.includes(expectedHeading)
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

  const apiResponse = await fetchImpl(
    `${apiUrl}/api/v1/health`,
    requestOptions,
  );
  assertOk(apiResponse, 'Staging API');

  const health = HealthResponseSchema.safeParse(await apiResponse.json());
  if (!health.success) {
    throw new Error('API health contract mismatch');
  }

  return {
    apiStatus: apiResponse.status,
    webRuntimeStatus: webRuntimeResponse.status,
    webStatus: webResponse.status,
  };
}

async function main() {
  const result = await verifyStaging({
    apiOrigin: process.env.STAGING_API_ORIGIN,
    webOrigin: process.env.STAGING_WEB_ORIGIN,
  });
  console.log(JSON.stringify(result));
}

const entrypoint = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : undefined;

if (entrypoint === import.meta.url) {
  main().catch((error) => {
    console.error(
      error instanceof Error ? error.message : 'Verification failed',
    );
    process.exitCode = 1;
  });
}
