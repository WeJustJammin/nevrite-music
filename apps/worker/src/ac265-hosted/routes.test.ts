import { Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';

import {
  AC265_GITHUB_OIDC_AUDIENCE,
  AC265_GITHUB_OIDC_ISSUER,
  AC265_GITHUB_OIDC_REPOSITORY,
  AC265_GITHUB_OIDC_REPOSITORY_ID,
  AC265_GITHUB_OIDC_REPOSITORY_OWNER,
  AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID,
  AC265_GITHUB_OIDC_SUBJECT,
  AC265_GITHUB_OIDC_WORKFLOW_REF,
  CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  type ContentSchemaRegistryAc265RunnerAuthorization,
} from '@wejammin/contracts';

import type { WorkerApp } from '../worker-types';
import { registerAc265HostedRoutes } from './routes';
import { Ac265RunConflictError, type Ac265HostedDependencies } from './types';

const ROUTE_PATH = '/api/v1/internal/ac265/runs/prepare';
const REQUEST_ID = '30000000-0000-4000-8000-000000000003';
const TOKEN = 'aaa.bbb.ccc';
const SOURCE_REVISION = 'a'.repeat(40);

const requestBody = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  runId: '10000000-0000-4000-8000-000000000001',
  candidateRef:
    'ac265-candidate://staging/40000000-0000-4000-8000-000000000004',
} as const;

const github = {
  issuer: AC265_GITHUB_OIDC_ISSUER,
  audience: AC265_GITHUB_OIDC_AUDIENCE,
  subject: AC265_GITHUB_OIDC_SUBJECT,
  repository: AC265_GITHUB_OIDC_REPOSITORY,
  repositoryId: AC265_GITHUB_OIDC_REPOSITORY_ID,
  repositoryOwner: AC265_GITHUB_OIDC_REPOSITORY_OWNER,
  repositoryOwnerId: AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID,
  repositoryVisibility: 'public',
  ref: 'refs/heads/main',
  refProtected: true,
  eventName: 'workflow_dispatch',
  environment: 'staging',
  runnerEnvironment: 'github-hosted',
  workflowRef: AC265_GITHUB_OIDC_WORKFLOW_REF,
  workflowSha: SOURCE_REVISION,
  sha: SOURCE_REVISION,
  githubRunId: '34796668543',
  githubRunAttempt: 1,
  jtiSha256: 'b'.repeat(64),
  tokenIssuedAt: '2026-09-14T01:45:00.000Z',
  tokenNotBefore: '2026-09-14T01:44:55.000Z',
  tokenExpiresAt: '2026-09-14T01:50:00.000Z',
} as const;

const authorization = (): ContentSchemaRegistryAc265RunnerAuthorization => ({
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  authorizationRef:
    'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  runId: requestBody.runId,
  identitySha256: 'c'.repeat(64),
  sourceRevision: SOURCE_REVISION,
  deploymentId: '6428523608',
  githubRunId: github.githubRunId,
  githubRunAttempt: github.githubRunAttempt,
  workflowSha: SOURCE_REVISION,
  authorizedAt: '2026-09-14T01:45:00.000Z',
  expiresAt: '2026-09-14T01:50:00.000Z',
  state: 'authorized',
  redacted: true,
});

const makeDependencies = () =>
  ({
    verifyGithubOidc: vi.fn(async () => github),
    prepareRun: vi.fn(async () => authorization()),
  }) satisfies Ac265HostedDependencies;

type TestApp = Hono<{
  Bindings: { APP_ENVIRONMENT: string };
  Variables: { requestId: string };
}>;

const makeApp = (dependencies: Ac265HostedDependencies): TestApp => {
  const app: TestApp = new Hono();
  app.use('*', async (context, next) => {
    context.set('requestId', REQUEST_ID);
    await next();
  });
  registerAc265HostedRoutes(app as unknown as WorkerApp, dependencies);
  return app;
};

const post = (
  app: TestApp,
  options: Readonly<{
    body?: string;
    authorization?: string;
    contentType?: string;
    contentLength?: string;
    contentEncoding?: string;
  }> = {},
) => {
  const headers = new Headers();
  if (options.authorization !== undefined)
    headers.set('authorization', options.authorization);
  if (options.contentType !== undefined)
    headers.set('content-type', options.contentType);
  if (options.contentLength !== undefined)
    headers.set('content-length', options.contentLength);
  if (options.contentEncoding !== undefined)
    headers.set('content-encoding', options.contentEncoding);
  return app.request(
    ROUTE_PATH,
    {
      method: 'POST',
      headers,
      ...(options.body === undefined ? {} : { body: options.body }),
    },
    { APP_ENVIRONMENT: 'staging' },
  );
};

const postRaw = (app: TestApp, body: BodyInit | null, headers: HeadersInit) => {
  const request = new Request(`https://worker.test${ROUTE_PATH}`, {
    method: 'POST',
    headers,
    body,
    duplex: 'half',
  } as RequestInit);
  return app.fetch(request, { APP_ENVIRONMENT: 'staging' });
};

const apiError = async (response: Response) => response.json();

describe('AC265 protected staging prepare-run route', () => {
  it('passes only the opaque candidate reference and verified runner identity to persistence', async () => {
    const events: string[] = [];
    const dependencies = makeDependencies();
    dependencies.verifyGithubOidc.mockImplementation(async () => {
      events.push('verify');
      return github;
    });
    dependencies.prepareRun.mockImplementation(async () => {
      events.push('prepare');
      return authorization();
    });
    const app = makeApp(dependencies);
    const response = await post(app, {
      body: JSON.stringify(requestBody),
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json; charset=utf-8',
      contentLength: String(
        new TextEncoder().encode(JSON.stringify(requestBody)).byteLength,
      ),
      contentEncoding: 'identity',
    });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-request-id')).toBe(REQUEST_ID);
    expect(events).toEqual(['verify', 'prepare']);
    expect(dependencies.verifyGithubOidc).toHaveBeenCalledWith(TOKEN);
    expect(dependencies.prepareRun).toHaveBeenCalledWith(
      {
        ...requestBody,
        github,
      },
      expect.any(AbortSignal),
    );
    const responseText = await response.clone().text();
    expect(await response.json()).toEqual(authorization());
    expect(responseText).not.toContain(TOKEN);
  });

  it('uses the same redacted 401 for missing, malformed, and rejected OIDC credentials', async () => {
    const missingDependencies = makeDependencies();
    const malformedDependencies = makeDependencies();
    const rejectedDependencies = makeDependencies();
    rejectedDependencies.verifyGithubOidc.mockRejectedValue(
      Object.assign(new Error(`private provider failure ${TOKEN}`), {
        code: 'OIDC_IDENTITY_REJECTED',
      }),
    );

    const missing = await post(makeApp(missingDependencies), {
      body: JSON.stringify(requestBody),
      contentType: 'application/json',
    });
    const malformed = await post(makeApp(malformedDependencies), {
      body: JSON.stringify(requestBody),
      authorization: 'Bearer invalid',
      contentType: 'application/json',
    });
    const rejected = await post(makeApp(rejectedDependencies), {
      body: JSON.stringify(requestBody),
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json',
    });

    expect(missing.status).toBe(401);
    expect(malformed.status).toBe(401);
    expect(rejected.status).toBe(401);
    const errorBodies = await Promise.all([
      apiError(missing),
      apiError(malformed),
      apiError(rejected),
    ]);
    expect(errorBodies[0]).toEqual({
      code: 'OIDC_IDENTITY_REJECTED',
      details: {},
      message: 'The protected runner identity could not be verified.',
      requestId: REQUEST_ID,
    });
    expect(errorBodies[1]).toEqual(errorBodies[0]);
    expect(errorBodies[2]).toEqual(errorBodies[0]);
    expect(JSON.stringify(errorBodies)).not.toContain(TOKEN);
    expect(missingDependencies.verifyGithubOidc).not.toHaveBeenCalled();
    expect(rejectedDependencies.prepareRun).not.toHaveBeenCalled();
  });

  it('maps unexpected OIDC verifier dependency failures to a generic 503', async () => {
    const dependencies = makeDependencies();
    dependencies.verifyGithubOidc.mockRejectedValue(
      new Error(`private JWKS outage ${TOKEN}`),
    );
    const response = await post(makeApp(dependencies), {
      body: JSON.stringify(requestBody),
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json',
    });

    const responseText = await response.clone().text();
    expect(response.status).toBe(503);
    expect(await apiError(response)).toEqual({
      code: 'DEPENDENCY_UNAVAILABLE',
      details: {},
      message: 'AC265 runner authorization is unavailable.',
      requestId: REQUEST_ID,
    });
    expect(responseText).not.toContain(TOKEN);
    expect(dependencies.prepareRun).not.toHaveBeenCalled();
  });

  it('maps primitive and uninspectable OIDC errors to a generic 503', async () => {
    const uninspectableError = new Proxy(
      {},
      {
        has: () => {
          throw new Error('private verifier detail');
        },
      },
    );
    const reasons: unknown[] = [
      'private primitive detail',
      null,
      uninspectableError,
    ];

    for (const reason of reasons) {
      const dependencies = makeDependencies();
      dependencies.verifyGithubOidc.mockImplementation(async () => {
        throw reason;
      });
      const response = await post(makeApp(dependencies), {
        body: JSON.stringify(requestBody),
        authorization: `Bearer ${TOKEN}`,
        contentType: 'application/json',
      });

      expect(response.status).toBe(503);
      const responseText = await response.clone().text();
      expect(await apiError(response)).toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
      });
      expect(responseText).not.toContain('private');
      expect(dependencies.prepareRun).not.toHaveBeenCalled();
    }
  });

  it('rejects a verifier result that fails the typed command contract', async () => {
    const dependencies = makeDependencies();
    dependencies.verifyGithubOidc.mockResolvedValue({
      ...github,
      sha: 'b'.repeat(40),
    });

    const response = await post(makeApp(dependencies), {
      body: JSON.stringify(requestBody),
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json',
    });

    expect(response.status).toBe(401);
    expect(await apiError(response)).toMatchObject({
      code: 'OIDC_IDENTITY_REJECTED',
    });
    expect(dependencies.prepareRun).not.toHaveBeenCalled();
  });

  it.each([
    ['missing content type', JSON.stringify(requestBody), undefined],
    ['wrong content type', JSON.stringify(requestBody), 'text/plain'],
    ['malformed JSON', '{', 'application/json'],
    [
      'schema-unknown field',
      JSON.stringify({ ...requestBody, unexpected: true }),
      'application/json',
    ],
    [
      'runner-supplied candidate identity',
      JSON.stringify({ ...requestBody, identity: { sourceRevision: 'x' } }),
      'application/json',
    ],
    [
      'runner-supplied identity digest',
      JSON.stringify({ ...requestBody, identitySha256: 'b'.repeat(64) }),
      'application/json',
    ],
    [
      'invalid candidate reference',
      JSON.stringify({ ...requestBody, candidateRef: 'https://attacker.test' }),
      'application/json',
    ],
    [
      'duplicate escaped-equivalent JSON keys',
      JSON.stringify(requestBody).replace(
        '"runId":',
        `"runId":"${requestBody.runId}","r\\u0075nId":`,
      ),
      'application/json',
    ],
  ])(
    'rejects %s before calling dependencies',
    async (_label, body, contentType) => {
      const dependencies = makeDependencies();
      const response = await post(makeApp(dependencies), {
        body,
        authorization: `Bearer ${TOKEN}`,
        ...(contentType === undefined ? {} : { contentType }),
      });

      expect(response.status).toBe(400);
      expect(await apiError(response)).toEqual({
        code: 'INVALID_REQUEST',
        details: {},
        message: 'The prepare-run request is invalid.',
        requestId: REQUEST_ID,
      });
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(dependencies.verifyGithubOidc).not.toHaveBeenCalled();
      expect(dependencies.prepareRun).not.toHaveBeenCalled();
    },
  );

  it('rejects a JSON body when its declared length is malformed or unsafe', async () => {
    const contentLengths = ['not-a-length', '9007199254740992', '32769'];

    for (const contentLength of contentLengths) {
      const dependencies = makeDependencies();
      const response = await post(makeApp(dependencies), {
        body: JSON.stringify(requestBody),
        authorization: `Bearer ${TOKEN}`,
        contentType: 'application/json',
        contentLength,
      });

      expect(response.status).toBe(400);
      expect(await apiError(response)).toMatchObject({
        code: 'INVALID_REQUEST',
      });
      expect(dependencies.verifyGithubOidc).not.toHaveBeenCalled();
    }
  });

  it('rejects unsupported content encodings and absent bodies before authentication', async () => {
    const encodedDependencies = makeDependencies();
    const encoded = await post(makeApp(encodedDependencies), {
      body: JSON.stringify(requestBody),
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json',
      contentEncoding: 'gzip',
    });

    const bodylessDependencies = makeDependencies();
    const bodyless = await postRaw(makeApp(bodylessDependencies), null, {
      authorization: `Bearer ${TOKEN}`,
      'content-type': 'application/json',
    });

    expect(encoded.status).toBe(400);
    expect(bodyless.status).toBe(400);
    expect(await apiError(encoded)).toMatchObject({ code: 'INVALID_REQUEST' });
    expect(await apiError(bodyless)).toMatchObject({ code: 'INVALID_REQUEST' });
    expect(encodedDependencies.verifyGithubOidc).not.toHaveBeenCalled();
    expect(bodylessDependencies.verifyGithubOidc).not.toHaveBeenCalled();
  });

  it('rejects missing content type and malformed UTF-8 without exposing details', async () => {
    const missingContentTypeDependencies = makeDependencies();
    const missingContentType = await postRaw(
      makeApp(missingContentTypeDependencies),
      null,
      { authorization: `Bearer ${TOKEN}` },
    );

    const invalidUtf8Dependencies = makeDependencies();
    const invalidUtf8 = await postRaw(
      makeApp(invalidUtf8Dependencies),
      new Uint8Array([0xff]),
      {
        authorization: `Bearer ${TOKEN}`,
        'content-type': 'application/json',
      },
    );

    expect(missingContentType.status).toBe(400);
    expect(invalidUtf8.status).toBe(400);
    expect(await apiError(missingContentType)).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(await apiError(invalidUtf8)).toMatchObject({
      code: 'INVALID_REQUEST',
    });
    expect(
      missingContentTypeDependencies.verifyGithubOidc,
    ).not.toHaveBeenCalled();
    expect(invalidUtf8Dependencies.verifyGithubOidc).not.toHaveBeenCalled();
  });

  it.each([
    ['empty object', '{}'],
    ['object without quoted key', '{criterion:true}'],
    ['object without colon', '{"criterion" true}'],
    ['object without a property separator', '{"criterion":"x" "runId":"x"}'],
    ['empty array', '{"criterion":[]}'],
    ['array with multiple values', '{"criterion":["x","y"]}'],
    ['array without a separator', '{"criterion":["x" "y"]}'],
    ['value beginning at a delimiter', '{"criterion":,"runId":"x"}'],
    ['trailing JSON data', '{}x'],
    ['JSON-invalid numeric token', '{"criterion":01}'],
    ['unterminated JSON string', '{"criterion":"unterminated}'],
  ])('rejects malformed strict JSON: %s', async (_label, body) => {
    const dependencies = makeDependencies();
    const response = await post(makeApp(dependencies), {
      body,
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json',
    });

    expect(response.status).toBe(400);
    expect(await apiError(response)).toMatchObject({ code: 'INVALID_REQUEST' });
    expect(dependencies.verifyGithubOidc).not.toHaveBeenCalled();
  });

  it('accepts bounded JSON whitespace while rejecting unsupported charsets', async () => {
    const spacedDependencies = makeDependencies();
    const spaced = await post(makeApp(spacedDependencies), {
      body: ` \n\r\t${JSON.stringify(requestBody)}\t \n\r`,
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json; charset=utf-8',
    });
    const charsetDependencies = makeDependencies();
    const unsupportedCharset = await post(makeApp(charsetDependencies), {
      body: JSON.stringify(requestBody),
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json; charset=utf-16',
    });

    expect(spaced.status).toBe(200);
    expect(unsupportedCharset.status).toBe(400);
    expect(charsetDependencies.verifyGithubOidc).not.toHaveBeenCalled();
  });

  it('keeps non-charset and malformed charset parameters non-authoritative', async () => {
    for (const contentType of [
      'application/json; profile=opaque',
      'application/json; charset=utf-8=extra',
    ]) {
      const dependencies = makeDependencies();
      const response = await post(makeApp(dependencies), {
        body: JSON.stringify(requestBody),
        authorization: `Bearer ${TOKEN}`,
        contentType,
      });

      expect(response.status).toBe(200);
      expect(dependencies.prepareRun).toHaveBeenCalledOnce();
    }
  });

  it('rejects a non-string token decoded from an object key defensively', async () => {
    const originalParse = JSON.parse;
    const parseSpy = vi.spyOn(JSON, 'parse').mockImplementation((source) => {
      if (source === '"criterion"') return 1;
      return originalParse(source);
    });
    const dependencies = makeDependencies();

    try {
      const response = await post(makeApp(dependencies), {
        body: JSON.stringify(requestBody),
        authorization: `Bearer ${TOKEN}`,
        contentType: 'application/json',
      });

      expect(response.status).toBe(400);
      expect(await apiError(response)).toMatchObject({
        code: 'INVALID_REQUEST',
      });
      expect(dependencies.verifyGithubOidc).not.toHaveBeenCalled();
    } finally {
      parseSpy.mockRestore();
    }
  });

  it('rejects a request body larger than 32 KiB without invoking authentication', async () => {
    const dependencies = makeDependencies();
    const response = await post(makeApp(dependencies), {
      body: `${JSON.stringify(requestBody)}${' '.repeat(33_000)}`,
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json',
    });

    expect(response.status).toBe(400);
    expect(await apiError(response)).toMatchObject({ code: 'INVALID_REQUEST' });
    expect(dependencies.verifyGithubOidc).not.toHaveBeenCalled();
  });

  it('returns canonical 404 in production and for non-POST methods', async () => {
    const dependencies = makeDependencies();
    const productionApp = makeApp(dependencies);
    const production = await productionApp.request(
      ROUTE_PATH,
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${TOKEN}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      { APP_ENVIRONMENT: 'production' },
    );
    const get = await productionApp.request(
      ROUTE_PATH,
      { method: 'GET' },
      { APP_ENVIRONMENT: 'staging' },
    );

    for (const response of [production, get]) {
      expect(response.status).toBe(404);
      expect(await apiError(response)).toEqual({
        code: 'NOT_FOUND',
        details: {},
        message: 'The requested API route does not exist.',
        requestId: REQUEST_ID,
      });
      expect(response.headers.get('cache-control')).toBe('no-store');
    }
    expect(dependencies.verifyGithubOidc).not.toHaveBeenCalled();
    expect(dependencies.prepareRun).not.toHaveBeenCalled();
  });

  it('maps identifiable run conflicts to 409 without exposing dependency details', async () => {
    const dependencies = makeDependencies();
    dependencies.prepareRun.mockRejectedValue(
      Object.assign(new Error(`private persistence detail ${TOKEN}`), {
        code: 'AC265_RUN_CONFLICT',
      }),
    );
    const response = await post(makeApp(dependencies), {
      body: JSON.stringify(requestBody),
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json',
    });

    expect(response.status).toBe(409);
    const responseText = await response.clone().text();
    expect(await apiError(response)).toEqual({
      code: 'AC265_RUN_CONFLICT',
      details: {},
      message: 'The AC265 run conflicts with an existing authorization.',
      requestId: REQUEST_ID,
    });
    expect(responseText).not.toContain(TOKEN);
  });

  it('maps the typed run-conflict error to 409', async () => {
    const dependencies = makeDependencies();
    dependencies.prepareRun.mockRejectedValue(new Ac265RunConflictError());
    const response = await post(makeApp(dependencies), {
      body: JSON.stringify(requestBody),
      authorization: `Bearer ${TOKEN}`,
      contentType: 'application/json',
    });

    expect(response.status).toBe(409);
    expect(await apiError(response)).toMatchObject({
      code: 'AC265_RUN_CONFLICT',
    });
  });

  it('maps persistence and invalid persistence responses to generic 503 errors', async () => {
    const failed = makeDependencies();
    failed.prepareRun.mockRejectedValue(
      new Error(`private database detail ${TOKEN}`),
    );
    const invalid = makeDependencies();
    invalid.prepareRun.mockResolvedValue({ token: TOKEN } as never);

    const responses = await Promise.all([
      post(makeApp(failed), {
        body: JSON.stringify(requestBody),
        authorization: `Bearer ${TOKEN}`,
        contentType: 'application/json',
      }),
      post(makeApp(invalid), {
        body: JSON.stringify(requestBody),
        authorization: `Bearer ${TOKEN}`,
        contentType: 'application/json',
      }),
    ]);

    for (const response of responses) {
      const responseText = await response.clone().text();
      expect(response.status).toBe(503);
      expect(await apiError(response)).toEqual({
        code: 'DEPENDENCY_UNAVAILABLE',
        details: {},
        message: 'AC265 runner authorization is unavailable.',
        requestId: REQUEST_ID,
      });
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(responseText).not.toContain(TOKEN);
    }
  });
});
