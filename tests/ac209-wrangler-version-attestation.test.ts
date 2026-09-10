import { describe, expect, it, vi } from 'vitest';

import {
  collectAc209WranglerVersionAttestation,
  type RunAc209WranglerJson,
} from '../infra/workflows/ac209-wrangler-version-attestation.ts';

const workspaceRoot = '/workspace/wejammin';
const sourceRevision = '7f72272c4ca46c738cc8e7941573af08cad33169';
const githubRunId = '34515738514';
const versionId = '544ce939-93c4-43d8-967f-f7e878e40dae';

const version = (overrides: Record<string, unknown> = {}) => ({
  id: versionId,
  number: 3,
  metadata: {
    created_on: '2026-09-10T18:41:52.694911Z',
    source: 'wrangler',
  },
  annotations: {
    'workers/tag': sourceRevision,
    'workers/message': `sourceRevision=${sourceRevision};githubRunId=${githubRunId}`,
    'workers/triggered_by': 'version_upload',
    ...overrides,
  },
});

const json = (values: unknown[], prefix = '') =>
  `${prefix}${JSON.stringify(values, null, 2)}\n`;

describe('AC209 Wrangler version attestation', () => {
  it('runs the pinned production versions-list command and returns sanitized exact-version data', () => {
    const runner = vi
      .fn<RunAc209WranglerJson>()
      .mockReturnValue(json([version()]));

    const attestation = collectAc209WranglerVersionAttestation({
      versionId,
      sourceRevision,
      workspaceRoot,
      runner,
    });

    expect(runner).toHaveBeenCalledOnce();
    expect(runner).toHaveBeenCalledWith([
      'versions',
      'list',
      '--config',
      `${workspaceRoot}/apps/worker/wrangler.jsonc`,
      '--name',
      'wejammin-api',
      '--json',
    ]);
    expect(attestation).toEqual({
      versionId,
      tag: sourceRevision,
      message: `sourceRevision=${sourceRevision};githubRunId=${githubRunId}`,
      triggeredBy: 'version_upload',
    });
    expect(attestation).not.toHaveProperty('metadata');
    expect(attestation).not.toHaveProperty('resources');
  });

  it('parses JSON after Wrangler preamble output', () => {
    const runner = vi
      .fn<RunAc209WranglerJson>()
      .mockReturnValue(json([version()], 'Using project config...\n'));

    expect(
      collectAc209WranglerVersionAttestation({
        versionId,
        sourceRevision,
        workspaceRoot,
        runner,
      }),
    ).toMatchObject({ versionId, tag: sourceRevision });
  });

  it.each([
    [
      'wrong tag',
      { 'workers/tag': 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' },
    ],
    [
      'wrong message',
      { 'workers/message': `sourceRevision=${sourceRevision};githubRunId=0` },
    ],
    ['missing tag', { 'workers/tag': undefined }],
    ['missing message', { 'workers/message': undefined }],
  ])('rejects an exact-version annotation with %s', (_label, overrides) => {
    const runner = vi
      .fn<RunAc209WranglerJson>()
      .mockReturnValue(json([version(overrides)]));

    expect(() =>
      collectAc209WranglerVersionAttestation({
        versionId,
        sourceRevision,
        workspaceRoot,
        runner,
      }),
    ).toThrow(/version tag|version message/u);
  });

  it.each([
    [
      'no matching version',
      [version({ 'workers/tag': sourceRevision })],
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    ],
    ['duplicate matching versions', [version(), version()], versionId],
  ])('rejects %s', (_label, values, requestedVersionId) => {
    const runner = vi.fn<RunAc209WranglerJson>().mockReturnValue(json(values));

    expect(() =>
      collectAc209WranglerVersionAttestation({
        versionId: requestedVersionId,
        sourceRevision,
        workspaceRoot,
        runner,
      }),
    ).toThrow(/exactly one|matching version/u);
  });

  it.each([undefined, 'upload'])(
    'rejects non-exact version provenance %s',
    (triggeredBy) => {
      const runner = vi
        .fn<RunAc209WranglerJson>()
        .mockReturnValue(
          json([version({ 'workers/triggered_by': triggeredBy })]),
        );

      expect(() =>
        collectAc209WranglerVersionAttestation({
          versionId,
          sourceRevision,
          workspaceRoot,
          runner,
        }),
      ).toThrow('version provenance is not exact');
    },
  );

  it('uses controlled errors that do not echo CLI output, errors, or secrets', () => {
    const secret = 'provider-token-that-must-never-be-emitted';
    const runner = vi.fn<RunAc209WranglerJson>(() => {
      throw new Error(`CLI failed: ${secret}`);
    });

    let message = '';
    try {
      collectAc209WranglerVersionAttestation({
        versionId,
        sourceRevision,
        workspaceRoot,
        runner,
      });
    } catch (error) {
      message = error instanceof Error ? error.message : String(error);
    }
    expect(message).toBe('AC209 Wrangler version attestation failed.');
    expect(message).not.toContain(secret);
  });

  it('fails closed for malformed input and malformed CLI JSON', () => {
    const runner = vi.fn<RunAc209WranglerJson>().mockReturnValue('not-json\n');

    expect(() =>
      collectAc209WranglerVersionAttestation({
        versionId: 'not-a-version-id',
        sourceRevision,
        workspaceRoot,
        runner,
      }),
    ).toThrow('AC209 Wrangler version attestation failed.');

    expect(() =>
      collectAc209WranglerVersionAttestation({
        versionId,
        sourceRevision,
        workspaceRoot,
        runner,
      }),
    ).toThrow('AC209 Wrangler version attestation failed.');
  });
});
