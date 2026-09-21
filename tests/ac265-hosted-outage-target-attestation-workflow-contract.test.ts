import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/attest-ac265-hosted-outage-target.yml',
    import.meta.url,
  ),
  'utf8',
);

const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));
const attestationStep = workflow.match(
  /\n\s{6}- name: Create protected canonical outage-target attestation[\s\S]*?(?=\n\s{6}- name: Upload)/u,
);
const uploadStep = workflow.match(
  /\n\s{6}- name: Upload protected outage-target source artifacts[\s\S]*$/u,
);

describe('AC265 protected outage-target source workflow contract', () => {
  it('is manual-only and accepts exactly the authorization and target references', () => {
    expect(workflow).toMatch(
      /^name:\s*AC265 protected source foundation \(outage-target attestation\)\s*$/mu,
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
    expect(dispatchInputs).toEqual(['authorization_ref', 'target_ref']);
    for (const input of dispatchInputs)
      expect(workflowHeader).toMatch(
        new RegExp(
          `${input}:\\n\\s+description:[\\s\\S]*?required: true\\n\\s+type: string`,
          'u',
        ),
      );
  });

  it('runs only on main with read-only permissions in staging', () => {
    expect(
      [...workflow.matchAll(/^\s{0,4}permissions:\s*\{([^}]+)\}/gmu)].map(
        (match) => match[1].trim(),
      ),
    ).toEqual(['contents: read', 'contents: read']);
    expect(workflow).not.toMatch(/id-token:\s*write/iu);
    expect(workflow).toMatch(
      /\n\s{2}attest:\n\s{4}if:\s*github\.ref == 'refs\/heads\/main'\s*$/mu,
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
    ).toEqual(['attest']);
  });

  it('checks out the dispatched commit without credentials and invokes the protected source entrypoint', () => {
    expect(attestationStep).toBeDefined();
    const step = attestationStep?.[0] ?? '';
    expect(workflow).toContain(
      'uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    );
    expect(workflow).toContain('ref: ${{ github.sha }}');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('uses: ./.github/actions/setup');
    expect(step).toContain(
      'node --experimental-strip-types infra/workflows/attest-ac265-approved-outage-target.ts',
    );
    for (const expected of [
      'AC265_AUTHORIZATION_REF: ${{ inputs.authorization_ref }}',
      'AC265_TARGET_REF: ${{ inputs.target_ref }}',
      'AC265_OUTAGE_TARGET_OUTPUT_DIR: ${{ runner.temp }}/ac265-outage-target',
      'SUPABASE_URL: ${{ vars.SUPABASE_URL }}',
      'SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}',
      'SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}',
      'AC265_OUTAGE_TARGET_SIGNING_PRIVATE_KEY_PEM: ${{ secrets.AC265_OUTAGE_TARGET_SIGNING_PRIVATE_KEY_PEM }}',
      'AC265_OUTAGE_TARGET_SIGNING_KEY_ID: ${{ vars.AC265_OUTAGE_TARGET_SIGNING_KEY_ID }}',
    ])
      expect(step).toContain(expected);
  });

  it('uploads exactly the canonical target and attestation JSON for one short-lived artifact', () => {
    expect(uploadStep).toBeDefined();
    const upload = uploadStep?.[0] ?? '';
    expect(upload).toContain(
      'uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
    );
    expect(upload).toContain(
      'name: ac265-outage-target-${{ github.run_id }}-${{ github.run_attempt }}',
    );
    expect(upload).toContain(
      '${{ runner.temp }}/ac265-outage-target/canonical-outage-target.json',
    );
    expect(upload).toContain(
      '${{ runner.temp }}/ac265-outage-target/outage-target-attestation.json',
    );
    expect(workflow.match(/uses: actions\/upload-artifact@/g)).toHaveLength(1);
    expect(
      [
        ...upload.matchAll(
          /^\s{12}(\$\{\{ runner\.temp \}\}\/[^\n]+\.json)\s*$/gmu,
        ),
      ].map((match) => match[1]),
    ).toEqual([
      '${{ runner.temp }}/ac265-outage-target/canonical-outage-target.json',
      '${{ runner.temp }}/ac265-outage-target/outage-target-attestation.json',
    ]);
    expect(upload).not.toMatch(
      /path:\s*\|[\s\S]*\$\{\{ runner\.temp \}\}\/ac265-outage-target\s*$/mu,
    );
    expect(upload).toContain('if-no-files-found: error');
    expect(upload).toContain('retention-days: 1');
    expect(upload).not.toMatch(
      /\b(?:SUPABASE_SECRET_KEY|AC265_OUTAGE_TARGET_SIGNING_PRIVATE_KEY_PEM)\b/u,
    );
    expect(workflow).not.toContain('GITHUB_STEP_SUMMARY');
  });

  it('contains no deployment, database lifecycle, provider-configuration, or acceptance operation', () => {
    expect(workflow).not.toMatch(
      /\b(?:wrangler\s+deploy|supabase\s+db\s+(?:push|reset|migrate)|terraform\s+(?:apply|destroy)|kubectl\s+apply|npm\s+publish)\b/iu,
    );
    expect(workflow).not.toMatch(/\b(?:deploy|production|acceptance)\b/iu);
  });
});
