import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const workflowPath = fileURLToPath(
  new URL(
    '../.github/workflows/preflight-ac265-hosted-e2e.yml',
    import.meta.url,
  ),
);
const workflow = existsSync(workflowPath)
  ? readFileSync(workflowPath, 'utf8')
  : '';
const prepareActionPath = fileURLToPath(
  new URL(
    '../.github/actions/ac265-hosted-e2e-prepare/action.yml',
    import.meta.url,
  ),
);
const preflightActionPath = fileURLToPath(
  new URL(
    '../.github/actions/ac265-hosted-e2e-preflight/action.yml',
    import.meta.url,
  ),
);
const prepareAction = existsSync(prepareActionPath)
  ? readFileSync(prepareActionPath, 'utf8')
  : '';
const preflightAction = existsSync(preflightActionPath)
  ? readFileSync(preflightActionPath, 'utf8')
  : '';

const configLineCount = (source: string): number =>
  source.trimEnd().split(/\r?\n/u).length;

const jobBlock = (source: string, name: string): string => {
  const headers = [...source.matchAll(/^ {2}([a-zA-Z0-9_-]+):\s*$/gmu)];
  const index = headers.findIndex((match) => match[1] === name);
  if (index === -1) return '';
  const start = headers[index]?.index ?? 0;
  const end = headers[index + 1]?.index ?? source.length;
  return source.slice(start, end);
};

const namedStep = (source: string, name: string, indent = 6): string => {
  const stepIndent = ' '.repeat(indent);
  const marker = `${stepIndent}- name: ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const remainder = source.slice(start);
  const next = remainder.indexOf(`\n${stepIndent}- `, marker.length);
  return next === -1 ? remainder : remainder.slice(0, next);
};

const inputBlock = (source: string, name: string): string => {
  const marker = `      ${name}:`;
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const remainder = source.slice(start).split('\n');
  const next = remainder
    .slice(1)
    .findIndex((line) => /^ {6}[a-zA-Z0-9_-]+:\s*$/u.test(line));
  return remainder.slice(0, next === -1 ? undefined : next + 1).join('\n');
};

describe('AC265 hosted E2E preflight workflow contract', () => {
  it('is explicitly preflight-only and omits hosted execution surfaces', () => {
    const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));
    const jobs = workflow.slice(workflow.indexOf('\njobs:'));
    const jobNames = [...jobs.matchAll(/^\x20{2}([a-zA-Z0-9_-]+):\s*$/gmu)].map(
      (match) => match[1],
    );
    const preflightSources = `${workflow}\n${prepareAction}\n${preflightAction}`;

    expect(workflow).toContain('name: Preflight AC265 hosted E2E candidate');
    expect(jobNames).toEqual(['preflight']);
    expect(workflow).not.toMatch(/^\x20{2}execute:\s*$/mu);
    expect(workflow).not.toMatch(/^\s+id-token:\s*write\s*$/mu);
    expect(`${prepareAction}\n${preflightAction}`).not.toMatch(
      /\$\{\{\s*secrets\./u,
    );
    for (const serviceVariable of [
      'AC265_SESSION_BROKER_ORIGIN',
      'AC265_EVIDENCE_SERVICE_ORIGIN',
      'AC265_FAULT_CONTROL_PLANE_ORIGIN',
      'AC265_WORKLOAD_IDENTITY_AUDIENCE',
    ])
      expect(preflightSources).not.toContain(serviceVariable);
    expect(preflightSources).not.toContain(
      'infra/workflows/collect-ac265-hosted-e2e.ts',
    );
    expect(preflightSources).not.toContain('ac265_prepare_hosted_run');
    expect(preflightSources).not.toContain(
      './.github/actions/ac265-hosted-e2e-execution',
    );
    expect(preflightSources).not.toMatch(
      /upload-artifact|hosted-e2e-report-v3/iu,
    );
    expect(`${workflowHeader}\n${preflightSources}`).not.toMatch(
      /acceptance|accepted|collection/iu,
    );
  });

  it('keeps the workflow and each local action within the 100-line config limit', () => {
    for (const [path, source] of [
      [workflowPath, workflow],
      [prepareActionPath, prepareAction],
      [preflightActionPath, preflightAction],
    ]) {
      expect(source, path).not.toBe('');
      expect(configLineCount(source), path).toBeLessThanOrEqual(100);
    }
  });

  it('is manual-only and requires exactly six staging and CI candidate selectors', () => {
    expect(workflow).not.toBe('');
    const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));
    expect(workflowHeader).toMatch(/^on:\n {2}workflow_dispatch:\s*$/mu);
    expect(workflowHeader).not.toMatch(
      /^ {2}(?:push|pull_request|pull_request_target|workflow_run|schedule|release):/mu,
    );

    expect(
      [...workflowHeader.matchAll(/^\x20{6}([a-zA-Z0-9_-]+):\s*$/gmu)].map(
        (match) => match[1],
      ),
    ).toEqual([
      'source_sha',
      'staging_run_id',
      'staging_run_attempt',
      'ci_run_id',
      'ci_run_attempt',
      'staging_deployment_id',
    ]);

    for (const input of [
      'source_sha',
      'staging_run_id',
      'staging_run_attempt',
      'ci_run_id',
      'ci_run_attempt',
      'staging_deployment_id',
    ]) {
      const definition = inputBlock(workflowHeader, input);
      expect(definition, input).not.toBe('');
      expect(definition, input).toMatch(/^ {8}required: true$/mu);
      expect(definition, input).toMatch(/^ {8}type: string$/mu);
    }

    expect(workflowHeader).toContain(
      'group: ac265-hosted-e2e-${{ github.ref }}',
    );
    expect(workflowHeader).toContain('cancel-in-progress: false');
    expect(workflow).toContain(
      'permissions: { actions: read, contents: read, deployments: read }',
    );
  });

  it('preflights the exact candidate on an isolated hosted runner in protected staging', () => {
    const preflight = jobBlock(workflow, 'preflight');
    expect(preflight).not.toBe('');
    expect(preflight).toContain("if: github.ref == 'refs/heads/main'");
    expect(preflight).toMatch(/^ {4}runs-on:\s*ubuntu-24\.04\s*$/mu);
    const timeout = Number(
      preflight.match(/^ {4}timeout-minutes:\s*(\d+)\s*$/mu)?.[1],
    );
    expect(timeout).toBeGreaterThan(0);
    expect(timeout).toBeLessThanOrEqual(20);
    expect(preflight).toMatch(/^ {4}environment:\s*$/mu);
    expect(preflight).toMatch(/^ {6}name:\s*staging\s*$/mu);
    expect(preflight).toContain(
      'candidate_ref: ${{ steps.enroll.outputs.candidate_ref }}',
    );
    expect(preflight).not.toMatch(/^\s+id-token:\s*write\s*$/mu);
    expect(preflight).not.toMatch(/\b(?:self-hosted|wejammin)\b/iu);

    const preflightInvocation = namedStep(
      preflight,
      'Verify exact staging and CI candidate provenance',
    );
    expect(preflightInvocation).toContain(
      'uses: ./.github/actions/ac265-hosted-e2e-preflight',
    );
    expect(preflightInvocation).not.toMatch(/uses: [^\n]+@/u);
    for (const mapping of [
      'source_sha: ${{ inputs.source_sha }}',
      'staging_run_id: ${{ inputs.staging_run_id }}',
      'staging_run_attempt: ${{ inputs.staging_run_attempt }}',
      'ci_run_id: ${{ inputs.ci_run_id }}',
      'ci_run_attempt: ${{ inputs.ci_run_attempt }}',
      'staging_deployment_id: ${{ inputs.staging_deployment_id }}',
    ])
      expect(preflightInvocation).toContain(mapping);
    for (const protectedValue of [
      'staging_web_origin: ${{ vars.STAGING_WEB_ORIGIN }}',
      'staging_api_origin: ${{ vars.STAGING_API_ORIGIN }}',
      'hosting_account_id: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}',
      'supabase_project_ref: ${{ vars.SUPABASE_PROJECT_REF }}',
      'supabase_origin: ${{ vars.SUPABASE_URL }}',
    ])
      expect(preflightInvocation).toContain(protectedValue);

    const preflightActionPreparation = namedStep(
      preflightAction,
      'Prepare exact staging and CI artifacts',
      4,
    );
    expect(preflightActionPreparation).toContain(
      'uses: ./.github/actions/ac265-hosted-e2e-prepare',
    );
    expect(preflightAction).not.toMatch(/\$\{\{\s*(?:secrets|vars)\./u);

    const checkout = namedStep(
      preflight,
      'Check out the approved workflow revision',
    );
    expect(checkout).toMatch(
      /uses: actions\/checkout@[0-9a-f]{40}(?:\s+# v\d+)?/u,
    );
    expect(checkout).toContain('ref: ${{ github.sha }}');
    expect(checkout).toContain('persist-credentials: false');
    expect(preflight.indexOf(checkout)).toBeLessThan(
      preflight.indexOf(preflightInvocation),
    );
    const workspaceSetup = namedStep(
      prepareAction,
      'Set up pinned workspace dependencies',
      4,
    );
    expect(workspaceSetup).toContain('uses: ./.github/actions/setup');

    const stagingDownload = namedStep(
      prepareAction,
      'Download the staging-verified candidate',
      4,
    );
    expect(stagingDownload).toMatch(
      /uses: actions\/download-artifact@[0-9a-f]{40}(?:\s+# v\d+)?/u,
    );
    expect(stagingDownload).toContain('name: staging-verified-candidate');
    expect(stagingDownload).toContain('path: candidate');
    expect(stagingDownload).toContain('run-id: ${{ inputs.staging_run_id }}');
    expect(stagingDownload).toContain('repository: ${{ github.repository }}');
    expect(stagingDownload).toContain('github-token: ${{ github.token }}');

    const ciDownload = namedStep(
      prepareAction,
      'Download the exact CI build',
      4,
    );
    expect(ciDownload).toMatch(
      /uses: actions\/download-artifact@[0-9a-f]{40}(?:\s+# v\d+)?/u,
    );
    expect(ciDownload).toContain(
      'name: workspace-build-${{ inputs.source_sha }}',
    );
    expect(ciDownload).toContain('path: ci-build');
    expect(ciDownload).toContain('run-id: ${{ inputs.ci_run_id }}');
    expect(ciDownload).toContain('repository: ${{ github.repository }}');
    expect(ciDownload).toContain('github-token: ${{ github.token }}');

    const verifier = namedStep(
      preflightAction,
      'Verify exact staging and CI candidate provenance',
      4,
    );
    for (const mapping of [
      'AC265_SOURCE_SHA: ${{ inputs.source_sha }}',
      'AC265_STAGING_RUN_ID: ${{ inputs.staging_run_id }}',
      'AC265_STAGING_RUN_ATTEMPT: ${{ inputs.staging_run_attempt }}',
      'AC265_CI_RUN_ID: ${{ inputs.ci_run_id }}',
      'AC265_CI_RUN_ATTEMPT: ${{ inputs.ci_run_attempt }}',
      'AC265_STAGING_DEPLOYMENT_ID: ${{ inputs.staging_deployment_id }}',
      'STAGING_WEB_ORIGIN: ${{ inputs.staging_web_origin }}',
      'STAGING_API_ORIGIN: ${{ inputs.staging_api_origin }}',
      'CLOUDFLARE_ACCOUNT_ID: ${{ inputs.hosting_account_id }}',
      'SUPABASE_PROJECT_REF: ${{ inputs.supabase_project_ref }}',
      'SUPABASE_URL: ${{ inputs.supabase_origin }}',
      'GITHUB_TOKEN: ${{ github.token }}',
      'GITHUB_REPOSITORY: ${{ github.repository }}',
    ])
      expect(verifier).toContain(mapping);
    expect(verifier).toContain(
      'node --experimental-strip-types infra/workflows/collect-ac265-hosted-e2e-preflight.ts',
    );

    const registration = namedStep(
      preflight,
      'Register exact candidate in staging',
      6,
    );
    expect(registration).toContain(
      'node --experimental-strip-types infra/workflows/register-ac265-candidate-enrollment.ts',
    );
    expect(registration).toContain('SUPABASE_URL: ${{ vars.SUPABASE_URL }}');
    expect(registration).toContain(
      'SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}',
    );
    expect(registration).toContain(
      'SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}',
    );
    expect(registration).toContain(
      'AC265_ENROLLMENT_REQUEST_PATH: ${{ steps.preflight.outputs.enrollment_request_path }}',
    );
    expect(preflightInvocation).not.toContain('SUPABASE_SECRET_KEY');
    expect(preflightAction).not.toContain('SUPABASE_SECRET_KEY');
    expect(preflight.indexOf(registration)).toBeGreaterThan(
      preflight.indexOf(preflightInvocation),
    );

    expect(preflightAction).toContain(
      'value: ${{ steps.verify.outputs.enrollment_request_path }}',
    );
    const serviceKeyLines = workflow
      .split(/\r?\n/u)
      .filter((line) => line.includes('SUPABASE_SECRET_KEY'));
    expect(serviceKeyLines).toEqual([
      '          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}',
    ]);
  });
});
