import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/register-ac265-approved-registry.yml',
    import.meta.url,
  ),
  'utf8',
);

const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));
const materializeStep = workflow.match(
  /\n\s{6}- name: Materialize the exact protected registry request[\s\S]*?(?=\n\s{6}- name: Register)/u,
);
const registerStep = workflow.match(
  /\n\s{6}- name: Register the approved registry entry[\s\S]*$/u,
);

describe('AC265 approved-registry registration workflow contract', () => {
  it('is manual-only, names the protected registration, and accepts exactly one required string', () => {
    expect(workflow).toMatch(
      /^name:\s*AC265 approved registry registration\s*$/mu,
    );
    expect(workflow).not.toMatch(/hosted acceptance/iu);
    expect(workflowHeader).toMatch(/^on:\s*$/mu);
    expect(workflowHeader).toMatch(/^\s{2}workflow_dispatch:\s*$/mu);
    expect(workflowHeader).not.toMatch(
      /^\s{2}(?:push|pull_request|pull_request_target|workflow_run|schedule|release):/mu,
    );
    expect(
      [...workflowHeader.matchAll(/^\s{2}([a-z][a-z0-9_-]*):\s*$/gmu)].map(
        (match) => match[1],
      ),
    ).toEqual(['workflow_dispatch']);

    const dispatchInputs = [
      ...workflowHeader.matchAll(/^\s{6}([a-z][a-z0-9_-]*):\s*$/gmu),
    ].map((match) => match[1]);
    expect(dispatchInputs).toEqual(['request_json']);
    for (const input of dispatchInputs)
      expect(workflowHeader).toMatch(
        new RegExp(
          input +
            ':\\n\\s+description:[\\s\\S]*?required: true\\n\\s+type: string',
          'u',
        ),
      );
  });

  it('runs only on main with read-only permissions in the protected staging environment', () => {
    expect(
      [...workflow.matchAll(/^\s{0,4}permissions:\s*\{([^}]+)\}/gmu)].map(
        (match) => match[1].trim(),
      ),
    ).toEqual(['contents: read', 'contents: read']);
    expect(workflow).not.toMatch(/id-token:\s*write/iu);
    expect(workflow).toMatch(
      /\n\s{2}register:\n\s{4}if:\s*github\.ref == 'refs\/heads\/main'\s*$/mu,
    );
    expect(workflow).toMatch(/^\s{4}runs-on:\s*ubuntu-24\.04\s*$/mu);
    expect(workflow).toMatch(/^\s{4}timeout-minutes:\s*(?:[1-9]|10)\s*$/mu);
    expect(workflow).toMatch(/^\s{4}environment:\s*staging\s*$/mu);

    expect(
      [
        ...workflow
          .slice(workflow.indexOf('\njobs:'))
          .matchAll(/^\s{2}([a-z][a-z0-9_-]*):\s*$/gmu),
      ].map((match) => match[1]),
    ).toEqual(['register']);
  });

  it('checks out the dispatched commit without credentials and uses the pinned local setup', () => {
    expect(workflow).toContain(
      'uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    );
    expect(workflow).toContain('ref: ${{ github.sha }}');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('uses: ./.github/actions/setup');
  });

  it('materializes only the exact dispatched request beneath runner temp with an owner-only mask', () => {
    expect(materializeStep).toBeDefined();
    const step = materializeStep?.[0] ?? '';
    expect(step).toContain(
      'AC265_REGISTRY_REGISTRATION_REQUEST_JSON: ${{ inputs.request_json }}',
    );
    expect(step).toContain(
      'AC265_REGISTRY_REGISTRATION_REQUEST_PATH: ${{ runner.temp }}/ac265-registry-registration-request.json',
    );
    expect(step).toContain('set -euo pipefail');
    expect(step).toContain('umask 077');
    expect(step).toContain(
      'printf \'%s\\n\' "$AC265_REGISTRY_REGISTRATION_REQUEST_JSON" > "$AC265_REGISTRY_REGISTRATION_REQUEST_PATH"',
    );
    expect(step).not.toMatch(/\beval\b|base64\s+-d|\bjq\b/u);
    expect(step).not.toContain('secrets.SUPABASE_SECRET_KEY');
  });

  it('passes only protected runtime inputs to the registration entrypoint', () => {
    expect(registerStep).toBeDefined();
    const step = registerStep?.[0] ?? '';
    expect(
      step.match(
        /node --experimental-strip-types infra\/workflows\/register-ac265-approved-registry\.ts/g,
      ),
    ).toHaveLength(1);

    for (const expected of [
      'AC265_REGISTRY_REGISTRATION_REQUEST_PATH: ${{ runner.temp }}/ac265-registry-registration-request.json',
      'SUPABASE_URL: ${{ vars.SUPABASE_URL }}',
      'SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}',
      'SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}',
    ])
      expect(step).toContain(expected);
    expect(
      workflow
        .split(/\r?\n/u)
        .filter((line) => line.includes('SUPABASE_SECRET_KEY')),
    ).toEqual([
      '          SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}',
    ]);
  });

  it('contains no deployment, database lifecycle, provider-configuration, or acceptance operation', () => {
    expect(workflow).not.toMatch(
      /\b(?:wrangler\s+deploy|supabase\s+db\s+(?:push|reset|migrate)|terraform\s+(?:apply|destroy)|kubectl\s+apply|npm\s+publish)\b/iu,
    );
    expect(workflow).not.toMatch(/\b(?:deploy|production|acceptance)\b/iu);
    expect(workflow).not.toContain('GITHUB_STEP_SUMMARY');
  });
});
