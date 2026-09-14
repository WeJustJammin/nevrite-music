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
  type ContentSchemaRegistryAc265PrepareRunCommand,
  type ContentSchemaRegistryAc265RunnerAuthorization,
} from '@wejammin/contracts';

import type { AsyncRpcClient } from '../async-runtime-support';
import type { WorkerBindings } from '../worker-bindings';
import {
  createProductionAc265HostedDependencies,
  type Ac265HostedProductionOptions,
} from './production';
import { Ac265RunConflictError } from './types';

const sourceRevision = 'a'.repeat(40);
const identitySha256 = 'b'.repeat(64);
const environment: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: sourceRevision,
  SUPABASE_SECRET_KEY: 'sb_secret_ac265_production_adapter',
  SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co',
};

const command: ContentSchemaRegistryAc265PrepareRunCommand = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  runId: '10000000-0000-4000-8000-000000000001',
  candidateRef:
    'ac265-candidate://staging/40000000-0000-4000-8000-000000000004',
  github: {
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
    workflowSha: sourceRevision,
    sha: sourceRevision,
    githubRunId: '34796668543',
    githubRunAttempt: 1,
    jtiSha256: '1'.repeat(64),
    tokenIssuedAt: '2026-09-14T01:45:00.000Z',
    tokenNotBefore: '2026-09-14T01:44:55.000Z',
    tokenExpiresAt: '2026-09-14T01:50:00.000Z',
  },
};

const authorization: ContentSchemaRegistryAc265RunnerAuthorization = {
  criterion: 'P2-S09-AC-265',
  schemaVersion: CONTENT_SCHEMA_REGISTRY_AC265_CONTROL_PLANE_SCHEMA_VERSION,
  authorizationRef:
    'ac265-authorization://staging/20000000-0000-4000-8000-000000000002',
  runId: command.runId,
  identitySha256,
  sourceRevision,
  deploymentId: '6428523608',
  githubRunId: command.github.githubRunId,
  githubRunAttempt: command.github.githubRunAttempt,
  workflowSha: sourceRevision,
  authorizedAt: '2026-09-14T01:45:00.000Z',
  expiresAt: '2026-09-14T01:50:00.000Z',
  state: 'authorized',
  redacted: true,
};

const optionsFor = (rpc: AsyncRpcClient): Ac265HostedProductionOptions => ({
  rpc,
  verifyGithubOidc: vi.fn(async () => command.github),
});

describe('AC265 production dependency adapter', () => {
  it('does not construct the hosted control plane outside staging', () => {
    const rpc = vi.fn() as unknown as AsyncRpcClient;
    expect(
      createProductionAc265HostedDependencies(
        { ...environment, APP_ENVIRONMENT: 'production' },
        undefined,
        optionsFor(rpc),
      ),
    ).toBeUndefined();
    expect(rpc).not.toHaveBeenCalled();
  });

  it('passes the verified command to the one protected RPC and validates its response', async () => {
    const rpc = vi.fn(async () => authorization) as unknown as AsyncRpcClient;
    const dependencies = createProductionAc265HostedDependencies(
      environment,
      undefined,
      optionsFor(rpc),
    );

    expect(dependencies).toBeDefined();
    await expect(dependencies?.prepareRun(command)).resolves.toEqual(
      authorization,
    );
    expect(rpc).toHaveBeenCalledExactlyOnceWith(
      environment,
      'ac265_prepare_hosted_run',
      { p_request: command },
      undefined,
    );
  });

  it('uses the bounded server-secret Supabase transport by default', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(authorization));
    const dependencies = createProductionAc265HostedDependencies(
      environment,
      fetchImpl,
      { verifyGithubOidc: vi.fn(async () => command.github) },
    );

    await expect(dependencies?.prepareRun(command)).resolves.toEqual(
      authorization,
    );
    const [input, init] = fetchImpl.mock.calls[0] ?? [];
    expect(String(input)).toBe(
      `${environment.SUPABASE_URL}/rest/v1/rpc/ac265_prepare_hosted_run`,
    );
    const headers = new Headers(init?.headers);
    expect(headers.get('apikey')).toBe(environment.SUPABASE_SECRET_KEY);
    expect(headers.has('authorization')).toBe(false);
    expect(headers.get('accept-profile')).toBe('platform_api');
    expect(headers.get('content-profile')).toBe('platform_api');
    expect(JSON.parse(String(init?.body))).toEqual({ p_request: command });
  });

  it('maps only the exact conflict sentinel and keeps malformed responses private', async () => {
    const conflictRpc = vi.fn(async () => ({
      status: 'conflict',
    })) as unknown as AsyncRpcClient;
    const conflict = createProductionAc265HostedDependencies(
      environment,
      undefined,
      optionsFor(conflictRpc),
    );
    await expect(conflict?.prepareRun(command)).rejects.toBeInstanceOf(
      Ac265RunConflictError,
    );

    const privateMarker = 'private-database-response';
    const malformedRpc = vi.fn(async () => ({
      privateMarker,
    })) as unknown as AsyncRpcClient;
    const malformed = createProductionAc265HostedDependencies(
      environment,
      undefined,
      optionsFor(malformedRpc),
    );
    let captured: unknown;
    try {
      await malformed?.prepareRun(command);
    } catch (error: unknown) {
      captured = error;
    }
    expect(captured).toBeInstanceOf(Error);
    expect(String(captured)).not.toContain(privateMarker);
    expect(JSON.stringify(captured)).not.toContain(privateMarker);
  });
});
