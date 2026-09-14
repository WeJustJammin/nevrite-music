import { describe, expect, it, vi } from 'vitest';

import {
  AC265_STAGING_API_ORIGIN,
  AC265_GITHUB_OIDC_AUDIENCE,
  CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  ContentSchemaRegistryAc265PrepareRunRequestSchema,
  ContentSchemaRegistryAc265RunnerAuthorizationSchema,
} from '@wejammin/contracts';

import {
  Ac265RunnerAuthorizationFailure,
  AC265_RUNNER_HTTP_MAX_RESPONSE_BYTES,
  AC265_RUNNER_HTTP_TIMEOUT_MS,
  prepareAc265HostedRun,
  requestAc265GithubOidcToken,
  requestAc265HostedRunAuthorization,
} from '../../infra/workflows/ac265-github-oidc-client.ts';

const sourceRevision = 'a'.repeat(40);
const jwt = 'eyJhbGciOiJFZERTQSJ9.eyJhdWQiOiJ3ZWphbW1pbiJ9.signature';
const request = ContentSchemaRegistryAc265PrepareRunRequestSchema.parse({
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  runId: '10000000-0000-4000-8000-000000000001',
  candidateRef:
    'ac265-candidate://staging/40000000-0000-4000-8000-000000000004',
});

const authorization = ContentSchemaRegistryAc265RunnerAuthorizationSchema.parse(
  {
    criterion: 'P2-S09-AC-265',
    schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
    authorizationRef:
      'ac265-authorization://staging/10000000-0000-4000-8000-000000000002',
    runId: request.runId,
    identitySha256: 'b'.repeat(64),
    sourceRevision,
    deploymentId: '6428523608',
    githubRunId: '34796668543',
    githubRunAttempt: 1,
    workflowSha: sourceRevision,
    authorizedAt: '2026-09-14T01:45:00.000Z',
    expiresAt: '2026-09-14T01:49:00.000Z',
    state: 'authorized',
    redacted: true,
  },
);

const githubEnvironment = {
  ACTIONS_ID_TOKEN_REQUEST_URL:
    'https://pipelinesghubeus24.actions.githubusercontent.com/runner/_apis/idtoken?api-version=2.0&audience=wrong',
  ACTIONS_ID_TOKEN_REQUEST_TOKEN: 'runner-request-credential',
};

function response(body: string, status = 200): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('AC265 GitHub Actions OIDC client', () => {
  it('labels failures with a fixed OIDC phase and no provider detail', async () => {
    const error = await requestAc265GithubOidcToken({
      environment: {
        ...githubEnvironment,
        ACTIONS_ID_TOKEN_REQUEST_URL: 'https://attacker.example/runner',
      },
      fetcher: vi.fn<typeof fetch>(),
    }).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(Ac265RunnerAuthorizationFailure);
    expect(error).toMatchObject({
      message: 'AC265 GitHub OIDC token request failed',
      phase: 'oidc_request',
    });
  });

  it('requests the exact audience from GitHub over HTTPS with the runner bearer credential', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(JSON.stringify({ value: jwt })));

    await expect(
      requestAc265GithubOidcToken({ environment: githubEnvironment, fetcher }),
    ).resolves.toBe(jwt);

    const [input, init] = fetcher.mock.calls[0]!;
    const url = new URL(String(input));
    expect(url.protocol).toBe('https:');
    expect(url.hostname).toBe(
      'pipelinesghubeus24.actions.githubusercontent.com',
    );
    expect(url.searchParams.getAll('audience')).toEqual([
      AC265_GITHUB_OIDC_AUDIENCE,
    ]);
    expect(init?.method).toBe('GET');
    expect(new Headers(init?.headers).get('authorization')).toBe(
      'Bearer runner-request-credential',
    );
    expect(init?.redirect).toBe('manual');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('rejects non-HTTPS, credentialed, and non-GitHub token-service URLs before fetching', async () => {
    const fetcher = vi.fn<typeof fetch>();

    for (const url of [
      'http://pipelines.actions.githubusercontent.com/runner',
      'https://user:password@pipelines.actions.githubusercontent.com/runner',
      'https://attacker.example/runner',
      'https://actions.githubusercontent.com/runner',
      'https://pipelines.actions.githubusercontent.com.attacker.example/runner',
      'https://foo..actions.githubusercontent.com/runner',
      'https://pipelines.actions.githubusercontent.com:444/runner',
      'https://pipelines.actions.githubusercontent.com/runner#fragment',
    ]) {
      await expect(
        requestAc265GithubOidcToken({
          environment: {
            ...githubEnvironment,
            ACTIONS_ID_TOKEN_REQUEST_URL: url,
          },
          fetcher,
        }),
      ).rejects.toThrow('AC265 GitHub OIDC token request failed');
    }

    expect(fetcher).not.toHaveBeenCalled();
  });

  it('accepts only the strict token-service object and redacts provider details', async () => {
    const providerBody = `sensitive-provider-body-${'x'.repeat(24)}`;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        response(JSON.stringify({ value: jwt, debug: providerBody })),
      )
      .mockResolvedValueOnce(response(providerBody, 500))
      .mockResolvedValueOnce(
        response(JSON.stringify({ value: 'not-a-compact-jwt' })),
      );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      let message = '';
      try {
        await requestAc265GithubOidcToken({
          environment: githubEnvironment,
          fetcher,
        });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toBe('AC265 GitHub OIDC token request failed');
      expect(message).not.toContain(
        githubEnvironment.ACTIONS_ID_TOKEN_REQUEST_TOKEN,
      );
      expect(message).not.toContain(providerBody);
    }
  });

  it('rejects redirects and responses beyond the byte limit', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response('redirect-body', 302))
      .mockResolvedValueOnce(
        response('x'.repeat(AC265_RUNNER_HTTP_MAX_RESPONSE_BYTES + 1)),
      );

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await expect(
        requestAc265GithubOidcToken({
          environment: githubEnvironment,
          fetcher,
        }),
      ).rejects.toThrow('AC265 GitHub OIDC token request failed');
    }
  });

  it('bounds token acquisition time and returns a redacted error', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<typeof fetch>(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new Error('private detail')),
            );
          }),
      );
      const pending = requestAc265GithubOidcToken({
        environment: githubEnvironment,
        fetcher,
      });
      const assertion = expect(pending).rejects.toThrow(
        'AC265 GitHub OIDC token request failed',
      );

      await vi.advanceTimersByTimeAsync(AC265_RUNNER_HTTP_TIMEOUT_MS);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('AC265 hosted-run preparation client', () => {
  it('labels destination validation and staging preparation as separate fixed phases', async () => {
    const destinationError = await requestAc265HostedRunAuthorization(
      { ...request, unexpected: true } as never,
      {
        environment: githubEnvironment,
        fetcher: vi.fn<typeof fetch>(),
      },
    ).catch((caught: unknown) => caught);
    expect(destinationError).toBeInstanceOf(Ac265RunnerAuthorizationFailure);
    expect(destinationError).toMatchObject({
      message: 'AC265 hosted-run destination validation failed',
      phase: 'destination_validation',
    });

    const preparationError = await prepareAc265HostedRun(
      request,
      'not-a-compact-jwt',
      { fetcher: vi.fn<typeof fetch>() },
    ).catch((caught: unknown) => caught);
    expect(preparationError).toBeInstanceOf(Ac265RunnerAuthorizationFailure);
    expect(preparationError).toMatchObject({
      message: 'AC265 hosted-run preparation request failed',
      phase: 'staging_prepare',
    });
  });

  it('posts a validated staging request with the GitHub JWT and validates the authorization', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(response(JSON.stringify(authorization)));

    await expect(
      prepareAc265HostedRun(request, jwt, {
        fetcher,
      }),
    ).resolves.toEqual(authorization);

    const [input, init] = fetcher.mock.calls[0]!;
    expect(String(input)).toBe(
      `${AC265_STAGING_API_ORIGIN}/api/v1/internal/ac265/runs/prepare`,
    );
    expect(init?.method).toBe('POST');
    expect(init?.redirect).toBe('manual');
    expect(new Headers(init?.headers).get('authorization')).toBe(
      `Bearer ${jwt}`,
    );
    expect(new Headers(init?.headers).get('content-type')).toBe(
      'application/json',
    );
    expect(JSON.parse(String(init?.body))).toEqual(request);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('validates the request and JWT before making a network call', async () => {
    const fetcher = vi.fn<typeof fetch>();

    await expect(
      prepareAc265HostedRun({ ...request, unexpected: true } as never, jwt, {
        fetcher,
      }),
    ).rejects.toThrow('AC265 hosted-run preparation request failed');
    await expect(
      prepareAc265HostedRun(request, 'not-a-compact-jwt', {
        fetcher,
      }),
    ).rejects.toThrow('AC265 hosted-run preparation request failed');

    expect(fetcher).not.toHaveBeenCalled();
  });

  it('rejects redirects and invalid authorization responses without leaking response bodies', async () => {
    const providerBody = `authorization-debug-${'y'.repeat(32)}`;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(providerBody, 302))
      .mockResolvedValueOnce(response(providerBody, 500))
      .mockResolvedValueOnce(
        response(JSON.stringify({ ...authorization, debug: providerBody })),
      );

    for (let attempt = 0; attempt < 3; attempt += 1) {
      let message = '';
      try {
        await prepareAc265HostedRun(request, jwt, {
          fetcher,
        });
      } catch (error) {
        message = error instanceof Error ? error.message : String(error);
      }
      expect(message).toBe('AC265 hosted-run preparation request failed');
      expect(message).not.toContain(jwt);
      expect(message).not.toContain(providerBody);
    }
  });

  it('bounds the preparation request time and response size', async () => {
    vi.useFakeTimers();
    try {
      const fetcher = vi.fn<typeof fetch>(
        (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new Error('private detail')),
            );
          }),
      );
      const pending = prepareAc265HostedRun(request, jwt, {
        fetcher,
      });
      const assertion = expect(pending).rejects.toThrow(
        'AC265 hosted-run preparation request failed',
      );

      await vi.advanceTimersByTimeAsync(AC265_RUNNER_HTTP_TIMEOUT_MS);
      await assertion;
    } finally {
      vi.useRealTimers();
    }

    const oversizedResponse = vi.fn<typeof fetch>().mockResolvedValue(
      response(
        JSON.stringify({
          value: 'x'.repeat(AC265_RUNNER_HTTP_MAX_RESPONSE_BYTES),
        }),
      ),
    );
    await expect(
      prepareAc265HostedRun(request, jwt, {
        fetcher: oversizedResponse,
      }),
    ).rejects.toThrow('AC265 hosted-run preparation request failed');
  });

  it('rejects a caller-supplied candidate identity before acquiring OIDC', async () => {
    const oidcFetcher = vi.fn<typeof fetch>();

    await expect(
      requestAc265HostedRunAuthorization(
        { ...request, identity: { sourceRevision } } as never,
        {
          environment: githubEnvironment,
          fetcher: oidcFetcher,
        },
      ),
    ).rejects.toThrow('AC265 hosted-run destination validation failed');
    expect(oidcFetcher).not.toHaveBeenCalled();
  });

  it('always posts to the hard-pinned staging API even if runtime options carry another origin', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(JSON.stringify({ value: jwt })))
      .mockResolvedValueOnce(response(JSON.stringify(authorization)));
    await expect(
      requestAc265HostedRunAuthorization(request, {
        trustedApiOrigin: 'https://collector.example',
        environment: githubEnvironment,
        fetcher,
      } as never),
    ).resolves.toEqual(authorization);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(new URL(String(fetcher.mock.calls[0]?.[0])).hostname).toBe(
      'pipelinesghubeus24.actions.githubusercontent.com',
    );
    expect(String(fetcher.mock.calls[1]?.[0])).toBe(
      `${AC265_STAGING_API_ORIGIN}/api/v1/internal/ac265/runs/prepare`,
    );
  });

  it('requests the OIDC token only after binding the trusted destination, then prepares the run', async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(JSON.stringify({ value: jwt })))
      .mockResolvedValueOnce(response(JSON.stringify(authorization)));

    await expect(
      requestAc265HostedRunAuthorization(request, {
        environment: githubEnvironment,
        fetcher,
      }),
    ).resolves.toEqual(authorization);

    expect(fetcher).toHaveBeenCalledTimes(2);
    const [tokenServiceUrl, tokenServiceInit] = fetcher.mock.calls[0]!;
    expect(new URL(String(tokenServiceUrl)).hostname).toBe(
      'pipelinesghubeus24.actions.githubusercontent.com',
    );
    expect(new Headers(tokenServiceInit?.headers).get('authorization')).toBe(
      'Bearer runner-request-credential',
    );

    const [prepareUrl, prepareInit] = fetcher.mock.calls[1]!;
    expect(String(prepareUrl)).toBe(
      `${AC265_STAGING_API_ORIGIN}/api/v1/internal/ac265/runs/prepare`,
    );
    expect(new Headers(prepareInit?.headers).get('authorization')).toBe(
      `Bearer ${jwt}`,
    );
  });

  it('keeps runId and candidateRef stable when a retry obtains fresh OIDC proof', async () => {
    const refreshedJwt =
      'eyJhbGciOiJFZERTQSJ9.eyJhdWQiOiJmcmVzaCJ9.refreshed-signature';
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(JSON.stringify({ value: jwt })))
      .mockResolvedValueOnce(response(JSON.stringify(authorization)))
      .mockResolvedValueOnce(response(JSON.stringify({ value: refreshedJwt })))
      .mockResolvedValueOnce(response(JSON.stringify(authorization)));

    await requestAc265HostedRunAuthorization(request, {
      environment: githubEnvironment,
      fetcher,
    });
    await requestAc265HostedRunAuthorization(request, {
      environment: githubEnvironment,
      fetcher,
    });

    const firstPrepare = fetcher.mock.calls[1]!;
    const retryPrepare = fetcher.mock.calls[3]!;
    expect(JSON.parse(String(firstPrepare[1]?.body))).toEqual(request);
    expect(JSON.parse(String(retryPrepare[1]?.body))).toEqual(request);
    expect(firstPrepare[1]?.body).toBe(retryPrepare[1]?.body);
    expect(new Headers(firstPrepare[1]?.headers).get('authorization')).toBe(
      `Bearer ${jwt}`,
    );
    expect(new Headers(retryPrepare[1]?.headers).get('authorization')).toBe(
      `Bearer ${refreshedJwt}`,
    );
  });
});
