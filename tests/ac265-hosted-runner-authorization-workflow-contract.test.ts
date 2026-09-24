import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const workflowPath = fileURLToPath(
  new URL('../.github/workflows/run-ac265-hosted-e2e.yml', import.meta.url),
);
const workflow = existsSync(workflowPath)
  ? readFileSync(workflowPath, 'utf8')
  : '';
const preflightPath = fileURLToPath(
  new URL(
    '../.github/workflows/preflight-ac265-hosted-e2e.yml',
    import.meta.url,
  ),
);
const preflight = existsSync(preflightPath)
  ? readFileSync(preflightPath, 'utf8')
  : '';
const entrypointPath = fileURLToPath(
  new URL(
    '../infra/workflows/run-ac265-hosted-runner-authorization.ts',
    import.meta.url,
  ),
);
const entrypoint = existsSync(entrypointPath)
  ? readFileSync(entrypointPath, 'utf8')
  : '';

const jobBlock = (source: string, name: string): string => {
  const headers = [...source.matchAll(/^ {2}([a-zA-Z0-9_-]+):\s*$/gmu)];
  const index = headers.findIndex((match) => match[1] === name);
  if (index === -1) return '';
  const start = headers[index]?.index ?? 0;
  const end = headers[index + 1]?.index ?? source.length;
  return source.slice(start, end);
};

const stepBlock = (source: string, name: string): string => {
  const marker = `      - name: ${name}`;
  const start = source.indexOf(marker);
  if (start === -1) return '';
  const remainder = source.slice(start);
  const next = remainder.indexOf('\n      - ', marker.length);
  return next === -1 ? remainder : remainder.slice(0, next);
};

describe('AC265 hosted-runner authorization foundation workflow', () => {
  it('names the workflow and summary as authorization foundation only', () => {
    expect(workflow).toMatch(
      /^name: AC265 hosted-runner authorization foundation \(not hosted acceptance\)$/mu,
    );
    expect(entrypoint).toContain(
      'Authorization foundation only. Hosted browser acceptance was not run.',
    );
    expect(workflow.trimEnd().split(/\r?\n/u).length).toBeLessThanOrEqual(100);
  });

  it('is manual-only and accepts only one opaque candidate reference', () => {
    const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));
    expect(workflowHeader).toMatch(/^on:\n {2}workflow_dispatch:\s*$/mu);
    expect(workflowHeader).not.toMatch(
      /^ {2}(?:push|pull_request|pull_request_target|workflow_run|schedule|release):/mu,
    );
    expect(
      [...workflowHeader.matchAll(/^ {6}([a-zA-Z0-9_-]+):\s*$/gmu)].map(
        (match) => match[1],
      ),
    ).toEqual(['candidate_ref']);

    const input = workflowHeader.slice(
      workflowHeader.indexOf('      candidate_ref:'),
    );
    expect(input).toMatch(/^ {8}description:.*opaque.*candidate reference/imu);
    expect(input).toMatch(/^ {8}required: true$/mu);
    expect(input).toMatch(/^ {8}type: string$/mu);
    expect(input).not.toMatch(/^ {8}default:/mu);
    expect(workflow).not.toMatch(/\$\{\{\s*(?:secrets|vars)\./u);
    expect(workflow).not.toMatch(
      /(?:api|web|supabase)_origin|identity_sha|digest/iu,
    );
  });

  it('uses main, a GitHub-hosted runner, protected staging, and job-scoped OIDC', () => {
    const authorize = jobBlock(workflow, 'authorize');
    expect(authorize).not.toBe('');
    expect(authorize).toContain("if: github.ref == 'refs/heads/main'");
    expect(authorize).toMatch(/^ {4}runs-on:\s*ubuntu-24\.04\s*$/mu);
    expect(authorize).toMatch(/^ {4}environment:\s*$/mu);
    expect(authorize).toMatch(/^ {6}name:\s*staging\s*$/mu);
    expect(authorize).toMatch(/^ {4}permissions:\s*$/mu);
    expect(authorize).toMatch(/^ {6}contents:\s*read\s*$/mu);
    expect(authorize).toMatch(/^ {6}id-token:\s*write\s*$/mu);
    expect(workflow).toMatch(/^permissions:\s*\{ contents: read \}$/mu);
    expect(authorize).not.toMatch(/self-hosted|wejammin/iu);

    const checkout = stepBlock(
      authorize,
      'Check out the approved workflow revision',
    );
    expect(checkout).toMatch(
      /uses: actions\/checkout@[0-9a-f]{40}(?:\s+# v\d+)?/u,
    );
    expect(checkout).toContain('ref: ${{ github.sha }}');
    expect(checkout).toContain('persist-credentials: false');
    expect(authorize.indexOf(checkout)).toBeLessThan(
      authorize.indexOf('uses: ./.github/actions/setup'),
    );
  });

  it('calls only the authorization entrypoint and leaves preflight browser acceptance gated', () => {
    const authorize = jobBlock(workflow, 'authorize');
    const authorizationStep = stepBlock(
      authorize,
      'Issue a redacted runner authorization',
    );
    expect(authorizationStep).toContain(
      'AC265_CANDIDATE_REF: ${{ inputs.candidate_ref }}',
    );
    expect(authorizationStep).toContain(
      'node --experimental-strip-types infra/workflows/run-ac265-hosted-runner-authorization.ts',
    );
    expect(authorizationStep).not.toMatch(
      /(?:origin|identity|digest|source_sha)/iu,
    );
    expect(workflow).not.toMatch(
      /collect-ac265-hosted-e2e\.ts|playwright|test:e2e|upload-artifact|execution-action/iu,
    );
    expect(preflight).not.toMatch(/^\s+id-token:\s*write\s*$/mu);
    expect(preflight).not.toContain(
      'infra/workflows/run-ac265-hosted-runner-authorization.ts',
    );
    expect(entrypoint).toContain('requestAc265HostedRunAuthorization');
  });

  it('verifies system Google Chrome before any hosted browser work', () => {
    const authorize = jobBlock(workflow, 'authorize');
    const chromeStep = stepBlock(authorize, 'Verify system Google Chrome');

    expect(chromeStep).toContain(
      'run: bash infra/workflows/verify-system-chrome.sh',
    );
    expect(chromeStep).not.toMatch(
      /playwright install|--with-deps|apt-get|curl|wget/iu,
    );
    expect(authorize.indexOf('Verify system Google Chrome')).toBeGreaterThan(
      authorize.indexOf('uses: ./.github/actions/setup'),
    );
    expect(authorize.indexOf('Verify system Google Chrome')).toBeLessThan(
      authorize.indexOf('Issue a redacted runner authorization'),
    );
    expect(workflow).not.toMatch(/playwright install/iu);
  });
});
