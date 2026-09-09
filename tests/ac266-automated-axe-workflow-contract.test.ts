import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  deploymentId,
  expectedIdentity,
  report,
  sourceRevision,
  webOrigin,
} from './contracts/phase-02-slice-09-automated-axe-report.test-support.ts';

const finalizerAxeVerifier = fileURLToPath(
  new URL('../infra/workflows/verify-staging-axe-evidence.sh', import.meta.url),
);

const readRepositoryFile = (path: string): string =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

const runBindingFixture = (
  targetUrl: string,
  logUrl = targetUrl,
): ReturnType<typeof spawnSync> => {
  const root = mkdtempSync(join(tmpdir(), 'wejammin-ac266-binding-'));
  const bin = join(root, 'bin');
  const workflowRoot = join(root, 'infra', 'workflows');
  mkdirSync(bin, { recursive: true });
  mkdirSync(workflowRoot, { recursive: true });
  const scriptPath = join(workflowRoot, 'collect-staging-axe-evidence.sh');
  writeFileSync(
    scriptPath,
    readRepositoryFile('infra/workflows/collect-staging-axe-evidence.sh'),
  );
  chmodSync(scriptPath, 0o755);
  const ghPath = join(bin, 'gh');
  writeFileSync(
    ghPath,
    `#!${process.execPath}
import { writeFileSync } from 'node:fs';

const fixture = JSON.parse(process.env.AC266_FIXTURE ?? '{}');
const endpoint = process.argv.at(-1) ?? '';
if (endpoint.includes('/actions/runs/'))
  writeFileSync(1, JSON.stringify(fixture.run));
else if (endpoint.includes('/statuses?'))
  writeFileSync(1, JSON.stringify([[fixture.status]]));
else if (endpoint.includes('/deployments?'))
  writeFileSync(1, JSON.stringify([[fixture.deployment]]));
else process.exit(2);
`,
  );
  chmodSync(ghPath, 0o755);
  const nodePath = join(bin, 'node');
  writeFileSync(
    nodePath,
    `#!${process.execPath}
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
if (args.includes('--input-type=module') || args.includes('-p')) {
  const result = spawnSync(process.env.AC266_REAL_NODE, args, { stdio: 'inherit' });
  process.exit(result.status ?? 1);
}
if (args.some((arg) => arg.includes('collect-content-schema-registry-axe-evidence.ts'))) {
  const directory = join(process.cwd(), 'promotion-candidate', 'accessibility');
  mkdirSync(directory, { recursive: true });
  writeFileSync(join(directory, 'axe.json'), '{}\\n');
  process.exit(0);
}
if (args.some((arg) => arg.includes('content-schema-registry-axe-report-verifier.ts')))
  process.exit(0);
const result = spawnSync(process.env.AC266_REAL_NODE, args, { stdio: 'inherit' });
process.exit(result.status ?? 1);
`,
  );
  chmodSync(nodePath, 0o755);
  const sourceRevision = 'a'.repeat(40);
  const runId = '777';
  const repository = 'WeJustJammin/nevrite-music';
  const githubEnv = join(root, 'github.env');
  const result = spawnSync('bash', [scriptPath], {
    cwd: root,
    encoding: 'utf8',
    env: {
      ...process.env,
      AC266_FIXTURE: JSON.stringify({
        run: {
          id: Number(runId),
          status: 'in_progress',
          conclusion: null,
          head_sha: sourceRevision,
          head_branch: 'main',
          event: 'workflow_run',
          path: '.github/workflows/deploy-staging.yml',
          actor: { login: 'WeJustJammin' },
          created_at: '2026-09-08T13:00:00.000Z',
          run_started_at: '2026-09-08T13:00:00.000Z',
        },
        deployment: {
          id: 6328276096,
          environment: 'staging',
          sha: sourceRevision,
          ref: 'main',
          task: 'deploy',
          creator: { login: 'WeJustJammin' },
          created_at: '2026-09-08T13:00:01.000Z',
          payload: {},
        },
        status: {
          state: 'in_progress',
          environment: 'staging',
          creator: { login: 'WeJustJammin' },
          created_at: '2026-09-08T13:00:02.000Z',
          target_url: targetUrl,
          log_url: logUrl,
        },
      }),
      AC266_REAL_NODE: process.execPath,
      DEPLOY_SHA: sourceRevision,
      GITHUB_REPOSITORY: repository,
      GITHUB_ENV: githubEnv,
      GITHUB_RUN_ID: runId,
      GITHUB_TOKEN: 'fixture-token',
      PATH: `${bin}:${process.env.PATH ?? ''}`,
      STAGING_WEB_ORIGIN: 'https://staging.example',
    },
  });
  rmSync(root, { recursive: true, force: true });
  return result;
};

const writeAxeEvidenceFixture = (root: string): string => {
  const accessibilityRoot = join(root, 'promotion-candidate/accessibility');
  mkdirSync(accessibilityRoot, { recursive: true });
  const reportBytes = Buffer.from(`${JSON.stringify(report, null, 2)}\n`);
  const digest = createHash('sha256').update(reportBytes).digest('hex');
  writeFileSync(join(accessibilityRoot, 'axe.json'), reportBytes);
  writeFileSync(
    join(accessibilityRoot, 'axe.sha256'),
    `${digest}  accessibility/axe.json\n`,
  );
  return digest;
};

describe('AC266 automated axe evidence workflow contract', () => {
  it('collects against the promoted staging SHA after public verification', () => {
    const workflow = readRepositoryFile('.github/workflows/deploy-staging.yml');
    const collector = readRepositoryFile(
      'infra/workflows/collect-staging-axe-evidence.sh',
    );
    const finalizer = readRepositoryFile(
      'infra/workflows/finalize-staging-candidate.sh',
    );
    const finalizerAxe = readRepositoryFile(
      'infra/workflows/verify-staging-axe-evidence.sh',
    );
    const axeCollector = readRepositoryFile(
      'infra/workflows/collect-content-schema-registry-axe-evidence.ts',
    );
    const webDeployStep =
      workflow.match(
        /- name: Deploy web SSR Worker staging artifact[\s\S]*?(?=\n\s{6}- name:)/u,
      )?.[0] ?? '';

    expect(workflow).toContain(
      'permissions: { actions: read, contents: read, deployments: read }',
    );
    expect(workflow).toContain('GITHUB_TOKEN: ${{ github.token }}');
    expect(workflow).toContain('githubRunId=$GITHUB_RUN_ID');
    expect(workflow).toContain(
      'CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}',
    );
    expect(workflow).toContain(
      'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
    );
    expect(workflow).toContain(
      'Verify public staging contracts and collect automated accessibility evidence',
    );
    expect(workflow).toContain(
      'bash infra/workflows/collect-staging-axe-evidence.sh',
    );
    expect(workflow).toContain(
      'bash infra/workflows/collect-provider-release-evidence.sh',
    );
    expect(workflow).toContain(
      'promotion-candidate/provider-release-evidence.json',
    );
    expect(workflow).toContain('Install pinned Chromium runtime');
    expect(workflow).toContain('pnpm exec playwright install chromium');
    expect(webDeployStep).toMatch(/--var APP_RELEASE:"\$DEPLOY_SHA"/u);
    expect(webDeployStep.match(/--var/gu)).toHaveLength(1);
    expect(workflow).toContain('promotion-candidate/accessibility/axe.json');
    expect(workflow).toContain('promotion-candidate/accessibility/axe.sha256');
    expect(finalizer).toContain('verify-staging-axe-evidence.sh');
    expect(finalizerAxe).toContain(
      'content-schema-registry-axe-report-verifier.ts',
    );
    expect(finalizerAxe).toContain('AC266_AXE_DIGEST');
    expect(
      workflow.indexOf('Deploy web SSR Worker staging artifact'),
    ).toBeLessThan(
      workflow.indexOf(
        'Verify public staging contracts and collect automated accessibility evidence',
      ),
    );
    expect(
      workflow.indexOf(
        'Verify public staging contracts and collect automated accessibility evidence',
      ),
    ).toBeLessThan(workflow.indexOf('Finalize staging promotion evidence'));
    expect(workflow.indexOf('Install pinned Chromium runtime')).toBeGreaterThan(
      workflow.indexOf('Deploy web SSR Worker staging artifact'),
    );
    expect(workflow.indexOf('Install pinned Chromium runtime')).toBeLessThan(
      workflow.indexOf(
        'Verify public staging contracts and collect automated accessibility evidence',
      ),
    );
    expect(workflow.trimEnd().split('\n').length).toBeLessThanOrEqual(100);

    expect(collector).toContain('gh api');
    expect(collector).toContain('--paginate');
    expect(collector).toContain('--slurp');
    expect(collector).toContain('GITHUB_RUN_ID');
    expect(collector).toContain('actions/runs/${runId}');
    expect(collector).toContain('currentRun.status !== "in_progress"');
    expect(collector).toContain('latestStatus?.state === "in_progress"');
    expect(collector).toContain('status?.target_url');
    expect(collector).toContain('status?.log_url');
    expect(collector).toContain('job/[0-9]+$');
    expect(collector).not.toContain('hasCurrentRunIdentity');
    expect(collector).toContain('deployment?.ref === currentRun.head_branch');
    expect(collector).toContain('deployment?.task === "deploy"');
    expect(collector).toContain('deployment?.creator?.login === runCreator');
    expect(collector).toContain(
      'Date.parse(deployment.created_at) >= runStartedAt',
    );
    expect(collector).toContain(
      'statusCreatedAt >= Date.parse(deployment.created_at)',
    );
    expect(collector).toContain('deployments?environment=staging&sha=');
    expect(collector).toContain('STAGING_DEPLOYMENT_ID');
    expect(collector).toContain(
      'collect-content-schema-registry-axe-evidence.ts',
    );
    expect(collector).toContain(
      'content-schema-registry-axe-report-verifier.ts',
    );
    expect(collector).toContain('report_root=promotion-candidate');
    expect(collector).not.toContain('REPORT_ROOT="$report_root"');
    expect(axeCollector).toContain('GITHUB_WORKSPACE');
    expect(axeCollector).toContain('x-wejammin-release');
    expect(axeCollector).toContain("serviceWorkers: 'block'");
    expect(axeCollector).toContain('blockCrossOriginDocumentRequests');
    expect(axeCollector).not.toContain('process.env.REPORT_ROOT');
    expect(collector).toContain('axe.sha256');
    expect(collector).toContain('"$axe_digest"');
    expect(collector).toContain('hosted_deployed_at');
    expect(collector).toContain('collection_cutoff');
    expect(collector).toContain("node -p 'new Date().toISOString()'");
    expect(collector).toContain('>> "$GITHUB_ENV"');
    expect(collector).toContain('AC266_AXE_HOSTED_DEPLOYMENT_ID');
    expect(collector).not.toContain('voiceover');
    expect(collector).not.toContain('nvda');
  });

  it('accepts the current run job URL on both deployment status links', () => {
    const result = runBindingFixture(
      'https://github.com/WeJustJammin/nevrite-music/actions/runs/777/job/12345',
    );
    expect(result.status).toBe(0);
  });

  it('rejects a deployment status linked to a different run', () => {
    const result = runBindingFixture(
      'https://github.com/WeJustJammin/nevrite-music/actions/runs/778/job/12345',
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'No current in-progress staging deployment matches the protected run metadata',
    );
  });

  it('rejects deployment status URLs with query state instead of an exact job URL', () => {
    const result = runBindingFixture(
      'https://github.com/WeJustJammin/nevrite-music/actions/runs/777/job/12345',
      'https://github.com/WeJustJammin/nevrite-music/actions/runs/777/job/12345?token=secret',
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain(
      'No current in-progress staging deployment matches the protected run metadata',
    );
  });

  it('rejects axe bytes mutated after collection at finalization', () => {
    const root = mkdtempSync(join(tmpdir(), 'wejammin-ac266-finalizer-'));
    try {
      const digest = writeAxeEvidenceFixture(root);
      const reportPath = join(
        root,
        'promotion-candidate/accessibility/axe.json',
      );
      const environment = {
        ...process.env,
        AC266_AXE_DIGEST: digest,
        AC266_AXE_HOSTED_DEPLOYED_AT: expectedIdentity.hostedDeployedAt,
        AC266_AXE_HOSTED_DEPLOYMENT_ID: deploymentId,
        AC266_AXE_TRUSTED_CUTOFF_AT: expectedIdentity.trustedCutoffAt,
        DEPLOY_SHA: sourceRevision,
        GITHUB_WORKSPACE: root,
        STAGING_WEB_ORIGIN: webOrigin,
      };
      const valid = spawnSync('bash', [finalizerAxeVerifier], {
        cwd: root,
        encoding: 'utf8',
        env: environment,
      });
      expect(valid.status).toBe(0);

      writeFileSync(reportPath, `${readFileSync(reportPath, 'utf8')}\n`);
      const mutated = spawnSync('bash', [finalizerAxeVerifier], {
        cwd: root,
        encoding: 'utf8',
        env: environment,
      });
      expect(mutated.status).not.toBe(0);
      expect(mutated.stderr).toContain(
        'Retained report digest does not match: automated accessibility',
      );
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it('rejects an accessibility directory symlink that escapes the workspace', () => {
    const root = mkdtempSync(join(tmpdir(), 'wejammin-ac266-finalizer-root-'));
    const outside = mkdtempSync(
      join(tmpdir(), 'wejammin-ac266-finalizer-outside-'),
    );
    try {
      const digest = writeAxeEvidenceFixture(root);
      const accessibilityPath = join(root, 'promotion-candidate/accessibility');
      const outsideAccessibilityPath = join(outside, 'accessibility');
      mkdirSync(outsideAccessibilityPath, { recursive: true });
      writeFileSync(
        join(outsideAccessibilityPath, 'axe.json'),
        readFileSync(join(accessibilityPath, 'axe.json')),
      );
      writeFileSync(
        join(outsideAccessibilityPath, 'axe.sha256'),
        readFileSync(join(accessibilityPath, 'axe.sha256')),
      );
      rmSync(accessibilityPath, { force: true, recursive: true });
      symlinkSync(outsideAccessibilityPath, accessibilityPath, 'dir');

      const result = spawnSync('bash', [finalizerAxeVerifier], {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          AC266_AXE_DIGEST: digest,
          AC266_AXE_HOSTED_DEPLOYED_AT: expectedIdentity.hostedDeployedAt,
          AC266_AXE_HOSTED_DEPLOYMENT_ID: deploymentId,
          AC266_AXE_TRUSTED_CUTOFF_AT: expectedIdentity.trustedCutoffAt,
          DEPLOY_SHA: sourceRevision,
          GITHUB_WORKSPACE: root,
          STAGING_WEB_ORIGIN: webOrigin,
        },
      });
      expect(result.status).not.toBe(0);
      expect(result.stderr).toMatch(/symlink|escapes/u);
    } finally {
      rmSync(root, { force: true, recursive: true });
      rmSync(outside, { force: true, recursive: true });
    }
  });
});
