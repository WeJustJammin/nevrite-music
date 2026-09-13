import { vi } from 'vitest';

export type Endpoint =
  'stagingRun' | 'deploymentList' | 'statuses' | 'intakeRun';

export interface Api {
  readonly stagingRun?: Record<string, unknown>;
  readonly intakeRun?: Record<string, unknown>;
  readonly deployments?: unknown;
  readonly statuses?: unknown;
  readonly statusesByDeployment?: Readonly<Record<string, unknown>>;
  readonly failure?: {
    readonly endpoint: Endpoint;
    readonly status: number;
    readonly headers?: Record<string, string>;
  };
}

export interface Ac266MockApiConfiguration {
  readonly repository: string;
  readonly stagingRunId: string;
  readonly deploymentId: string;
  readonly intakeRunId: string;
  readonly defaultStagingRun: Record<string, unknown>;
  readonly defaultIntakeRun: Record<string, unknown>;
  readonly defaultDeployments: unknown[];
  readonly defaultStatuses: unknown[];
}

const response = (
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });

export const createAc266MockFetch = (
  api: Api,
  config: Ac266MockApiConfiguration,
) =>
  vi.fn<typeof fetch>(async (input) => {
    const url = new URL(
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const statusMatch = /\/deployments\/([0-9]+)\/statuses$/u.exec(
      url.pathname,
    );
    const endpoint: Endpoint | undefined =
      url.pathname ===
      `/repos/${config.repository}/actions/runs/${config.stagingRunId}`
        ? 'stagingRun'
        : url.pathname === `/repos/${config.repository}/deployments`
          ? 'deploymentList'
          : statusMatch
            ? 'statuses'
            : url.pathname ===
                `/repos/${config.repository}/actions/runs/${config.intakeRunId}`
              ? 'intakeRun'
              : undefined;
    if (endpoint === undefined)
      return response({ message: 'unexpected mocked API path' }, 404);
    if (api.failure?.endpoint === endpoint)
      return response(
        { message: 'mocked GitHub API failure' },
        api.failure.status,
        api.failure.headers,
      );
    if (endpoint === 'deploymentList')
      return response(api.deployments ?? config.defaultDeployments);
    if (endpoint === 'statuses') {
      const id = statusMatch?.[1] ?? '';
      const fallback = id === config.deploymentId ? config.defaultStatuses : [];
      return response(
        id === config.deploymentId
          ? (api.statuses ?? api.statusesByDeployment?.[id] ?? fallback)
          : (api.statusesByDeployment?.[id] ?? fallback),
      );
    }
    return response(
      endpoint === 'stagingRun'
        ? (api.stagingRun ?? config.defaultStagingRun)
        : (api.intakeRun ?? config.defaultIntakeRun),
    );
  });
