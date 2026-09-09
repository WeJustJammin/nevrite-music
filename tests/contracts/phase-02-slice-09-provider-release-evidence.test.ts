import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  collectCloudflareProviderReleaseEvidence,
  writeCloudflareProviderReleaseEvidence,
} from '../../infra/workflows/cloudflare-provider-release-evidence.ts';
import { CloudflareProviderReleaseEvidenceSchema } from '../../packages/contracts/src/content-schema-registry/operational-release-evidence-provider.ts';

const sourceRevision = 'a'.repeat(40);
const githubRunId = '12345';
const collectedAt = '2026-09-08T01:00:02.000Z';
const providerVerifier = join(
  process.cwd(),
  'infra/workflows/verify-provider-release-evidence.sh',
);

const uuid = (digit: string): string =>
  `${digit.repeat(8)}-${digit.repeat(4)}-4${digit.repeat(3)}-8${digit.repeat(3)}-${digit.repeat(12)}`;

const fixture = (): Record<string, Record<string, unknown[]>> => {
  const message = `sourceRevision=${sourceRevision};githubRunId=${githubRunId}`;
  const workers = [
    ['wejammin-api-staging', '1', '2'],
    ['wejammin-web-staging', '3', '4'],
  ];
  return Object.fromEntries(
    workers.map(([name, versionDigit, deploymentDigit]) => {
      const versionId = uuid(versionDigit);
      return [
        name,
        {
          versions: [
            {
              id: versionId,
              metadata: { created_on: '2026-09-08T01:00:00.000Z' },
              annotations: {
                'workers/tag': sourceRevision,
                'workers/message': message,
              },
            },
          ],
          deployments: [
            {
              id: uuid(deploymentDigit),
              created_on: '2026-09-08T01:00:01.000Z',
              strategy: 'percentage',
              annotations: { 'workers/triggered_by': 'deployment' },
              versions: [{ version_id: versionId, percentage: 100 }],
            },
          ],
        },
      ];
    }),
  );
};

const collect = (
  values = fixture(),
): ReturnType<typeof collectCloudflareProviderReleaseEvidence> =>
  collectCloudflareProviderReleaseEvidence(
    sourceRevision,
    githubRunId,
    process.cwd(),
    (args) => {
      const name = args[args.indexOf('--name') + 1];
      return JSON.stringify(values[name][args[0]]);
    },
    collectedAt,
  );

describe('Slice 09 AC266 Cloudflare provider release evidence', () => {
  it('retains redacted exact identity for both 100% staging Workers', () => {
    const report = collect();
    expect(report.redacted).toBe(true);
    expect(report.workers.map(({ workerName }) => workerName)).toEqual([
      'wejammin-api-staging',
      'wejammin-web-staging',
    ]);
    expect(CloudflareProviderReleaseEvidenceSchema.parse(report)).toEqual(
      report,
    );
  });

  it('rejects internally inconsistent retained provider identity', () => {
    const report = collect();
    const [api, web] = report.workers;
    const parses = (workers: typeof report.workers) =>
      CloudflareProviderReleaseEvidenceSchema.safeParse({
        ...report,
        workers,
      }).success;

    expect(parses([api, { ...web, workerName: api.workerName }])).toBe(false);
    expect(
      parses([
        { ...api, annotations: { ...api.annotations, tag: 'b'.repeat(40) } },
        web,
      ]),
    ).toBe(false);
    expect(
      parses([
        {
          ...api,
          annotations: { ...api.annotations, message: 'wrong-release' },
        },
        web,
      ]),
    ).toBe(false);
    expect(
      parses([{ ...api, versionCreatedAt: '2026-09-08T01:00:02.000Z' }, web]),
    ).toBe(false);
    expect(
      parses([
        { ...api, deploymentCreatedAt: '2026-09-08T01:00:03.000Z' },
        web,
      ]),
    ).toBe(false);
  });

  it.each([
    [
      'wrong tag',
      (values: ReturnType<typeof fixture>) => {
        values['wejammin-api-staging'].versions[0].annotations['workers/tag'] =
          'b'.repeat(40);
      },
    ],
    [
      'wrong message',
      (values: ReturnType<typeof fixture>) => {
        values['wejammin-web-staging'].versions[0].annotations[
          'workers/message'
        ] = 'untrusted';
      },
    ],
    [
      'non-100% traffic',
      (values: ReturnType<typeof fixture>) => {
        values['wejammin-api-staging'].deployments[0].versions[0].percentage =
          50;
      },
    ],
    [
      'multiple active versions',
      (values: ReturnType<typeof fixture>) => {
        values['wejammin-web-staging'].deployments[0].versions.push({
          version_id: uuid('5'),
          percentage: 0,
        });
      },
    ],
    [
      'latest deployment points to an unknown version',
      (values: ReturnType<typeof fixture>) => {
        values['wejammin-api-staging'].deployments.push({
          id: uuid('6'),
          created_on: '2026-09-08T01:01:00.000Z',
          strategy: 'percentage',
          annotations: { 'workers/triggered_by': 'deployment' },
          versions: [{ version_id: uuid('7'), percentage: 100 }],
        });
      },
    ],
  ])('rejects %s', (_label, mutate) => {
    const values = fixture();
    mutate(values);
    expect(() => collect(values)).toThrow();
  });

  it('rejects symlinked output files and ancestor directories', () => {
    const report = collect();
    const root = mkdtempSync(join(tmpdir(), 'wejammin-provider-evidence-'));
    const outside = mkdtempSync(join(tmpdir(), 'wejammin-provider-outside-'));
    try {
      const candidateDirectory = join(root, 'promotion-candidate');
      mkdirSync(candidateDirectory);
      const outsideFile = join(outside, 'provider-release-evidence.json');
      writeFileSync(outsideFile, 'sentinel\n');
      const linkedOutput = join(
        candidateDirectory,
        'provider-release-evidence.json',
      );
      symlinkSync(outsideFile, linkedOutput);
      expect(() =>
        writeCloudflareProviderReleaseEvidence(report, linkedOutput, root),
      ).toThrow('symlink');
      expect(readFileSync(outsideFile, 'utf8')).toBe('sentinel\n');

      const linkedDirectory = join(root, 'linked-candidate');
      symlinkSync(outside, linkedDirectory, 'dir');
      const escapedOutput = join(
        linkedDirectory,
        'provider-release-evidence.json',
      );
      expect(() =>
        writeCloudflareProviderReleaseEvidence(report, escapedOutput, root),
      ).toThrow(/symlink|escapes/u);
      expect(existsSync(join(outside, 'provider-release-evidence.json'))).toBe(
        true,
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('rejects malformed timestamps and output paths outside the workspace', () => {
    const values = fixture();
    values['wejammin-api-staging'].versions[0].metadata.created_on =
      'not-a-time';
    expect(() => collect(values)).toThrow();

    const report = collect();
    const root = mkdtempSync(join(tmpdir(), 'wejammin-provider-evidence-'));
    try {
      expect(() =>
        writeCloudflareProviderReleaseEvidence(
          report,
          join(root, '..', 'escape.json'),
          root,
        ),
      ).toThrow('escapes the workspace');
      const path = join(root, 'provider-release-evidence.json');
      writeCloudflareProviderReleaseEvidence(report, path, root);
      expect(JSON.parse(readFileSync(path, 'utf8')).redacted).toBe(true);
      const verifierEnvironment = {
        ...process.env,
        DEPLOY_SHA: sourceRevision,
        GITHUB_RUN_ID: githubRunId,
        GITHUB_WORKSPACE: process.cwd(),
      };
      expect(() =>
        execFileSync('bash', [providerVerifier, path], {
          env: verifierEnvironment,
          stdio: 'pipe',
        }),
      ).not.toThrow();
      expect(() =>
        execFileSync('bash', [providerVerifier, path], {
          env: { ...verifierEnvironment, GITHUB_RUN_ID: '54321' },
          stdio: 'pipe',
        }),
      ).toThrow();
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
