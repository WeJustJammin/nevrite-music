import { describe, expect, it, vi } from 'vitest';

import { verifyContentSchemaRegistrySloSource } from '../infra/workflows/verify-content-schema-registry-slo-source';

const apiUrl = 'https://api.github.com/';
const repository = 'owner/repo';
const deploymentId = '123456789';
const sourceRevision = 'a'.repeat(40);
const runId = '700100';
const jobId = '5001';
const workflowId = 346315225;
const deployedAt = '2026-09-04T23:45:00.000Z';
const successfulStatusAt = '2026-09-04T23:50:00.000Z';
const jobUrl = `https://github.com/${repository}/actions/runs/${runId}/job/${jobId}`;
const statusPath = `/repos/${repository}/deployments/${deploymentId}/statuses`;
const statusUrl = `${apiUrl.slice(0, -1)}${statusPath}`;

type StatusPage = Readonly<{ value: unknown; link?: string }>;

const response = (value: unknown, link?: string): Response =>
  new Response(JSON.stringify(value), {
    status: 200,
    headers: {
      'content-type': 'application/json',
      ...(link === undefined ? {} : { Link: link }),
    },
  });

const status = (id: number, createdAt = '2026-09-04T22:00:00.000Z') => ({
  id,
  state: 'success',
  environment: 'production',
  created_at: createdAt,
  updated_at: createdAt,
  target_url: jobUrl,
  log_url: jobUrl,
});

const statusPage = (firstId: number, length: number, createdAt?: string) =>
  Array.from({ length }, (_, index) => status(firstId + index, createdAt));

const pageLink = (page: number, relation: 'next' | 'last') =>
  `<${statusUrl}?per_page=100&page=${page}>; rel="${relation}"`;

const linkHeader = (nextPage: number | undefined, lastPage: number) =>
  [
    ...(nextPage === undefined ? [] : [pageLink(nextPage, 'next')]),
    pageLink(lastPage, 'last'),
  ].join(', ');

const fixedOptions = {
  apiUrl,
  repository,
  token: 'synthetic-bearer-token',
  productionDeploymentId: deploymentId,
  sourceRevision,
  utcDay: '2026-09-05',
  now: () => Date.parse('2026-09-06T00:00:01.000Z'),
};

const fetchForPages = (
  pageFor: (page: number, readCount: number) => StatusPage,
) => {
  const pageReads = new Map<number, number>();
  const fetchImpl = vi.fn<typeof fetch>(async (input) => {
    const url = new URL(String(input));
    if (url.pathname.endsWith(`/deployments/${deploymentId}`))
      return response({
        id: Number(deploymentId),
        environment: 'production',
        sha: sourceRevision,
        ref: 'main',
        task: 'deploy',
        created_at: '2026-09-04T22:00:00.000Z',
        updated_at: successfulStatusAt,
      });
    if (url.pathname === statusPath) {
      const page = Number(url.searchParams.get('page') ?? 1);
      const readCount = (pageReads.get(page) ?? 0) + 1;
      pageReads.set(page, readCount);
      const result = pageFor(page, readCount);
      return response(result.value, result.link);
    }
    if (url.pathname.endsWith(`/actions/jobs/${jobId}`))
      return response({
        id: Number(jobId),
        run_id: Number(runId),
        run_attempt: 1,
        workflow_name: 'Deploy production',
        name: 'deploy',
        status: 'completed',
        conclusion: 'success',
        head_sha: sourceRevision,
        head_branch: 'main',
        created_at: '2026-09-04T22:00:00.000Z',
        started_at: '2026-09-04T22:00:01.000Z',
        completed_at: deployedAt,
        html_url: jobUrl,
      });
    if (url.pathname.endsWith('/actions/workflows/deploy-production.yml'))
      return response({
        id: workflowId,
        name: 'Deploy production',
        path: '.github/workflows/deploy-production.yml',
        state: 'active',
      });
    if (url.pathname.endsWith(`/actions/runs/${runId}/attempts/1`))
      return response({
        id: Number(runId),
        run_attempt: 1,
        workflow_id: workflowId,
        name: 'Deploy production',
        path: '.github/workflows/deploy-production.yml',
        event: 'workflow_dispatch',
        status: 'completed',
        conclusion: 'success',
        head_sha: sourceRevision,
        head_branch: 'main',
        created_at: '2026-09-04T21:55:00.000Z',
        run_started_at: '2026-09-04T22:00:00.000Z',
        updated_at: successfulStatusAt,
        repository: { id: 123, full_name: repository },
        head_repository: { id: 123, full_name: repository },
      });
    throw new Error('Unexpected test URL.');
  });
  return { fetchImpl, pageReads };
};

describe('AC211 complete deployment-status pagination', () => {
  it('reads every page and computes the latest status across the full result', async () => {
    const firstPage = statusPage(1, 100);
    const laterStatus = status(101, successfulStatusAt);
    const { fetchImpl, pageReads } = fetchForPages((page) =>
      page === 1
        ? { value: firstPage, link: linkHeader(2, 2) }
        : { value: [laterStatus], link: linkHeader(undefined, 2) },
    );

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).resolves.toMatchObject({ productionDeployedAt: laterStatus.created_at });

    expect(pageReads.get(1)).toBe(2);
    expect(pageReads.get(2)).toBe(2);
  });

  it('rejects duplicate deployment-status IDs across pages', async () => {
    const { fetchImpl } = fetchForPages((page) =>
      page === 1
        ? { value: statusPage(1, 100), link: linkHeader(2, 2) }
        : { value: [status(100)], link: linkHeader(undefined, 2) },
    );

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).rejects.toThrow(/pagination/u);
  });

  it('rejects malformed later pages', async () => {
    const { fetchImpl } = fetchForPages((page) =>
      page === 1
        ? { value: statusPage(1, 100), link: linkHeader(2, 2) }
        : { value: { statuses: [] }, link: linkHeader(undefined, 2) },
    );

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).rejects.toThrow(/pagination/u);
  });

  it('fails closed when pagination continues beyond the page cap', async () => {
    const { fetchImpl, pageReads } = fetchForPages((page) => ({
      value: statusPage((page - 1) * 100 + 1, 100),
      link: `<${statusUrl}?per_page=100&page=${page + 1}>; rel="next"`,
    }));

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).rejects.toThrow(/pagination/u);
    expect(pageReads.get(11)).toBeUndefined();
  });

  it('rejects a page-one change detected during the pagination stability read', async () => {
    const original = statusPage(1, 100);
    const changed = [status(1001), ...original.slice(1)];
    const { fetchImpl } = fetchForPages((page, readCount) => {
      if (page === 1)
        return {
          value: readCount === 1 ? original : changed,
          link: linkHeader(2, 2),
        };
      return { value: [status(101)], link: linkHeader(undefined, 2) };
    });

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).rejects.toThrow(/pagination/u);
  });

  it('rejects a later-page change in the complete stability snapshot', async () => {
    const { fetchImpl } = fetchForPages((page, readCount) =>
      page === 1
        ? { value: statusPage(1, 100), link: linkHeader(2, 2) }
        : {
            value: [status(100 + readCount)],
            link: linkHeader(undefined, 2),
          },
    );

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).rejects.toThrow(/pagination/u);
  });

  it('rejects an unstable last-page link across the traversal', async () => {
    const { fetchImpl } = fetchForPages((page) =>
      page === 1
        ? { value: statusPage(1, 100), link: linkHeader(2, 2) }
        : { value: [status(101)], link: linkHeader(3, 3) },
    );

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).rejects.toThrow(/pagination/u);
  });

  it('rejects a literal attacker origin without following it', async () => {
    const { fetchImpl } = fetchForPages((page) =>
      page === 1
        ? {
            value: statusPage(1, 100),
            link: '<https://attacker.example/>; rel="next"',
          }
        : { value: [status(101)], link: linkHeader(undefined, 2) },
    );

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).rejects.toThrow(/pagination/u);
    expect(
      fetchImpl.mock.calls.every(
        ([input]) => new URL(String(input)).hostname === 'api.github.com',
      ),
    ).toBe(true);
  });

  it('rejects a last-link change between complete pagination snapshots', async () => {
    const { fetchImpl } = fetchForPages((page, readCount) => {
      if (page === 1) {
        const lastPage = readCount === 1 ? 2 : 3;
        return { value: statusPage(1, 100), link: linkHeader(2, lastPage) };
      }
      if (page === 2 && readCount === 1)
        return { value: [status(101)], link: linkHeader(undefined, 2) };
      if (page === 2) return { value: [status(101)], link: linkHeader(3, 3) };
      return { value: [status(201)], link: linkHeader(undefined, 3) };
    });

    await expect(
      verifyContentSchemaRegistrySloSource(fixedOptions, fetchImpl),
    ).rejects.toThrow(/pagination/u);
  });
});
