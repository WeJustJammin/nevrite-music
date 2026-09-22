import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const workflowPath = fileURLToPath(
  new URL(
    '../../.github/workflows/attest-ac265-hosted-artifact-source-manifest.yml',
    import.meta.url,
  ),
);
const workflow = existsSync(workflowPath)
  ? readFileSync(workflowPath, 'utf8')
  : '';
const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));
const publishEntrypointPath = fileURLToPath(
  new URL(
    '../../infra/workflows/publish-ac265-hosted-artifact-source-manifest.ts',
    import.meta.url,
  ),
);
const publishEntrypoint = existsSync(publishEntrypointPath)
  ? readFileSync(publishEntrypointPath, 'utf8')
  : '';

const jobBlock = (source: string, name: string): string => {
  const headers = [...source.matchAll(/^ {2}([a-zA-Z0-9_-]+):\s*$/gmu)];
  const index = headers.findIndex((match) => match[1] === name);
  if (index === -1) return '';
  const start = headers[index]?.index ?? 0;
  const end = headers[index + 1]?.index ?? source.length;
  return source.slice(start, end);
};

const namedStep = (source: string, name: string): string => {
  const marker = `      - name: ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const remainder = source.slice(start);
  const next = remainder.indexOf('\n      - ', marker.length);
  return next === -1 ? remainder : remainder.slice(0, next);
};

const inputBlock = (source: string, name: string): string => {
  const marker = `      ${name}:`;
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const lines = source.slice(start).split('\n');
  const next = lines
    .slice(1)
    .findIndex((line) => /^ {6}[a-zA-Z0-9_-]+:\s*$/u.test(line));
  return lines.slice(0, next === -1 ? undefined : next + 1).join('\n');
};

describe('AC265 protected source-manifest publication workflow contract', () => {
  it('is manual-only and accepts exactly the two opaque protected references', () => {
    expect(workflow).not.toBe('');
    expect(workflow).toMatch(
      /^name:\s*AC265 protected source-manifest publication\s*$/mu,
    );
    expect(workflowHeader).toMatch(/^on:\s*$/mu);
    expect(workflowHeader).toMatch(/^ {2}workflow_dispatch:\s*$/mu);
    expect(workflowHeader).not.toMatch(
      /^ {2}(?:push|pull_request|pull_request_target|workflow_run|schedule|release):/mu,
    );
    expect(
      [...workflowHeader.matchAll(/^ {2}([a-z][a-z0-9_-]*):\s*$/gmu)].map(
        (match) => match[1],
      ),
    ).toEqual(['workflow_dispatch']);

    const inputs = [
      ...workflowHeader.matchAll(/^ {6}([a-z][a-z0-9_-]*):\s*$/gmu),
    ].map((match) => match[1]);
    expect(inputs).toEqual(['authorization_ref', 'candidate_ref']);
    for (const input of inputs) {
      const definition = inputBlock(workflowHeader, input);
      expect(definition, input).toMatch(/^ {8}required: true$/mu);
      expect(definition, input).toMatch(/^ {8}type: string$/mu);
    }
    expect(workflowHeader).toContain(
      'group: ac265-source-manifest-${{ github.ref }}',
    );
    expect(workflowHeader).toContain('cancel-in-progress: false');
  });

  it('runs only on main in protected staging with narrowly scoped read permissions', () => {
    const publishJob = jobBlock(workflow, 'publish');
    expect(publishJob).not.toBe('');
    expect(publishJob).toContain("if: github.ref == 'refs/heads/main'");
    expect(publishJob).toMatch(/^ {4}runs-on:\s*ubuntu-24\.04\s*$/mu);
    const timeout = Number(
      publishJob.match(/^ {4}timeout-minutes:\s*(\d+)\s*$/mu)?.[1],
    );
    expect(timeout).toBeGreaterThan(0);
    expect(timeout).toBeLessThanOrEqual(15);
    expect(publishJob).toMatch(/^ {4}environment:\s*staging\s*$/mu);
    expect(workflow).toContain(
      'permissions:\n  actions: read\n  contents: read\n  deployments: read',
    );
    expect(publishJob).toContain(
      'permissions:\n      actions: read\n      contents: read\n      deployments: read',
    );
    expect(workflow).not.toMatch(
      /^\s+(?:id-token|contents|actions|deployments):\s*write\s*$/mu,
    );
    expect(workflow).not.toMatch(
      /^\s+(?:pull-requests|packages|security-events):/mu,
    );
    expect(workflow).not.toMatch(/\bproduction\b/iu);
  });

  it('checks out the dispatched revision without credentials and uses the pinned local setup', () => {
    const publishJob = jobBlock(workflow, 'publish');
    expect(workflow).toContain(
      'uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    );
    expect(publishJob).toContain('ref: ${{ github.sha }}');
    expect(publishJob).toContain('persist-credentials: false');
    expect(publishJob).toContain('uses: ./.github/actions/setup');
  });

  it('requires an executable publication CLI with explicit resolve and publish commands', () => {
    expect(publishEntrypoint, publishEntrypointPath).not.toBe('');
    expect(publishEntrypoint).toMatch(/process\.argv/u);
    expect(publishEntrypoint).toContain('--resolve-source');
    expect(publishEntrypoint).toContain('--publish');
    expect(publishEntrypoint).toMatch(/process\.exitCode\s*=\s*1/u);
  });

  it('resolves separate CI and staging selectors from protected authority and downloads exact bytes', () => {
    const publishJob = jobBlock(workflow, 'publish');
    const resolve = namedStep(
      publishJob,
      'Resolve protected source artifact selectors',
    );
    const ciDownload = namedStep(
      publishJob,
      'Download exact CI source artifact',
    );
    const stagingDownload = namedStep(
      publishJob,
      'Download exact staging source artifact',
    );
    expect(resolve).not.toBe('');
    expect(ciDownload).not.toBe('');
    expect(stagingDownload).not.toBe('');
    expect(resolve).toContain(
      'node --experimental-strip-types infra/workflows/publish-ac265-hosted-artifact-source-manifest.ts --resolve-source',
    );
    expect(resolve).toContain(
      'AC265_AUTHORIZATION_REF: ${{ inputs.authorization_ref }}',
    );
    expect(resolve).toContain(
      'AC265_CANDIDATE_REF: ${{ inputs.candidate_ref }}',
    );
    expect(resolve).toContain('GITHUB_REPOSITORY: ${{ github.repository }}');
    expect(resolve).toContain('GITHUB_TOKEN: ${{ github.token }}');
    expect(resolve).toContain(
      'AC265_PUBLICATION_CONTEXT_BUNDLE_B64: ${{ secrets.AC265_PUBLICATION_CONTEXT_BUNDLE_B64 }}',
    );
    expect(resolve).not.toContain('SUPABASE_URL:');
    expect(resolve).not.toContain('SUPABASE_PROJECT_REF:');
    expect(resolve).not.toContain('SUPABASE_SECRET_KEY:');
    const publish = namedStep(
      publishJob,
      'Publish finalized AC265 source-manifest bundle',
    );
    expect(publish).not.toContain('GITHUB_REPOSITORY:');
    expect(publish).not.toContain('GITHUB_TOKEN:');
    expect(workflow.match(/uses: actions\/download-artifact@/g)).toHaveLength(
      2,
    );
    for (const [download, artifactId, runId, path] of [
      [ciDownload, 'ci_artifact_id', 'ci_run_id', 'ci-source'],
      [
        stagingDownload,
        'staging_artifact_id',
        'staging_run_id',
        'staging-source',
      ],
    ] as const) {
      expect(download).toContain(
        'uses: actions/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c',
      );
      expect(download).toContain(
        'artifact-ids: ${{ steps.resolve.outputs.' + artifactId + ' }}',
      );
      expect(download).toContain('repository: ${{ github.repository }}');
      expect(download).toContain(
        'run-id: ${{ steps.resolve.outputs.' + runId + ' }}',
      );
      expect(download).toContain('github-token: ${{ github.token }}');
      expect(download).toContain('skip-decompress: true');
      expect(download).toContain('digest-mismatch: error');
      expect(download).toContain(
        'path: ${{ runner.temp }}/ac265-source-manifest/' + path,
      );
      expect(download).not.toMatch(/\$\{\{\s*inputs\./u);
    }
    expect(workflow).not.toMatch(/source_(?:run_id|artifact_ids)/u);
    expect(workflow).not.toMatch(
      /\$\{\{\s*inputs\.(?:sha|run|path|deployment|key|trust|artifact)/iu,
    );
  });

  it('passes only protected environment values to publication and never puts secrets in argv', () => {
    const publishJob = jobBlock(workflow, 'publish');
    const publish = namedStep(
      publishJob,
      'Publish finalized AC265 source-manifest bundle',
    );
    expect(publish).not.toBe('');
    expect(publish).toContain(
      'node --experimental-strip-types infra/workflows/publish-ac265-hosted-artifact-source-manifest.ts --publish',
    );
    for (const expected of [
      'AC265_AUTHORIZATION_REF: ${{ inputs.authorization_ref }}',
      'AC265_CANDIDATE_REF: ${{ inputs.candidate_ref }}',
      'AC265_PUBLICATION_CONTEXT_BUNDLE_B64: ${{ secrets.AC265_PUBLICATION_CONTEXT_BUNDLE_B64 }}',
      'AC265_RESOLVED_CONTEXT_BUNDLE_SHA256: ${{ steps.resolve.outputs.context_bundle_sha256 }}',
      'AC265_RESOLVED_CI_RUN_ID: ${{ steps.resolve.outputs.ci_run_id }}',
      'AC265_RESOLVED_CI_ARTIFACT_ID: ${{ steps.resolve.outputs.ci_artifact_id }}',
      'AC265_RESOLVED_STAGING_RUN_ID: ${{ steps.resolve.outputs.staging_run_id }}',
      'AC265_RESOLVED_STAGING_ARTIFACT_ID: ${{ steps.resolve.outputs.staging_artifact_id }}',
      'AC265_SOURCE_MANIFEST_CI_SOURCE_DIR: ${{ runner.temp }}/ac265-source-manifest/ci-source',
      'AC265_SOURCE_MANIFEST_STAGING_SOURCE_DIR: ${{ runner.temp }}/ac265-source-manifest/staging-source',
      'AC265_SOURCE_MANIFEST_OUTPUT_DIR: ${{ runner.temp }}/ac265-source-manifest/finalized',
      'SUPABASE_URL: ${{ vars.SUPABASE_URL }}',
      'SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}',
      'SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}',
      'AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM: ${{ secrets.AC265_SOURCE_MANIFEST_SIGNING_PRIVATE_KEY_PEM }}',
      'AC265_SOURCE_MANIFEST_SIGNING_KEY_ID: ${{ vars.AC265_SOURCE_MANIFEST_SIGNING_KEY_ID }}',
    ])
      expect(publish).toContain(expected);
    const command = publish.match(/^\s+run:\s+(.+)$/mu)?.[1] ?? '';
    expect(command).not.toMatch(/\$\{\{\s*(?:secrets|vars)\./u);
    expect(command).not.toMatch(
      /\b(?:SUPABASE_SECRET_KEY|PRIVATE_KEY|SIGNING_KEY_ID)\b/u,
    );
    expect(workflow).not.toMatch(
      /\$\{\{\s*inputs\.(?:sha|run|path|deployment|key|trust)/iu,
    );
  });

  it('uploads exactly one finalized allowlisted bundle for thirty days', () => {
    const publishJob = jobBlock(workflow, 'publish');
    const upload = namedStep(
      publishJob,
      'Upload only finalized source-manifest bundle',
    );
    expect(upload).not.toBe('');
    expect(upload).toContain(
      'uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
    );
    expect(upload).toContain(
      'name: ac265-source-manifest-${{ github.run_id }}-${{ github.run_attempt }}',
    );
    expect(upload).toContain(
      '${{ runner.temp }}/ac265-source-manifest/finalized/ac265-source-manifest.bundle',
    );
    expect(
      [...upload.matchAll(/^ {12}(\$\{\{ runner\.temp \}\}\/[^\n]+)$/gmu)].map(
        (match) => match[1],
      ),
    ).toEqual([
      '${{ runner.temp }}/ac265-source-manifest/finalized/ac265-source-manifest.bundle',
    ]);
    expect(upload).toContain('if-no-files-found: error');
    expect(upload).toContain('retention-days: 30');
    expect(workflow.match(/uses: actions\/upload-artifact@/g)).toHaveLength(1);
    expect(upload).not.toMatch(/\$\{\{\s*secrets\./u);
    expect(upload).not.toMatch(/\$\{\{\s*inputs\./u);
  });

  it('contains no deployment, provider configuration, or production operation', () => {
    expect(workflow).not.toMatch(
      /\b(?:wrangler\s+deploy|supabase\s+db\s+(?:push|reset|migrate)|terraform\s+(?:apply|destroy)|kubectl\s+apply|npm\s+publish)\b/iu,
    );
    expect(workflow).not.toMatch(
      /\b(?:deploy|production|pull-request|package)\b/iu,
    );
  });
});
