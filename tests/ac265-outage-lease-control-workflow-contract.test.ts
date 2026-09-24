import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/operate-ac265-outage-lease.yml',
    import.meta.url,
  ),
  'utf8',
);

const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));
const operationStep = workflow.match(
  /\n\s{6}- name: Run one bounded outage-lease control operation[\s\S]*?(?=\n\s{6}- name: Upload)/u,
);
const uploadStep = workflow.match(
  /\n\s{6}- name: Upload the redacted control record[\s\S]*$/u,
);

describe('AC265 outage-lease control workflow contract', () => {
  it('is manual-only and accepts exactly the bounded operation inputs', () => {
    expect(workflow).toMatch(
      /^name: AC265 outage-lease control operation \(staging control plane only\)\s*$/mu,
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
    expect(
      [...workflowHeader.matchAll(/^\s{6}([a-z][a-z0-9_-]*):\s*$/gmu)].map(
        (match) => match[1],
      ),
    ).toEqual([
      'operation',
      'authorization_ref',
      'target_ref',
      'idempotency_ref',
      'lease_ref',
      'lease_sha256',
    ]);
    expect(workflowHeader).toMatch(
      /operation:\n\s+description:[\s\S]*?required: true\n\s+type: choice\n\s+options: \[acquire, consume, release\]/u,
    );
    for (const input of ['authorization_ref', 'target_ref', 'idempotency_ref'])
      expect(workflowHeader).toMatch(
        new RegExp(
          `${input}:\\n\\s+description:[\\s\\S]*?required: true\\n\\s+type: string`,
          'u',
        ),
      );
    for (const optional of ['lease_ref', 'lease_sha256'])
      expect(workflowHeader).toMatch(
        new RegExp(
          `${optional}:\\n\\s+description:[\\s\\S]*?required: false\\n\\s+type: string`,
          'u',
        ),
      );
    expect(workflowHeader).not.toMatch(/dependency|route|duration|limit/iu);
    expect(workflowHeader).not.toMatch(/^\s{8}default:/mu);
  });

  it('runs only on main with read-only permissions in staging', () => {
    expect(
      [...workflow.matchAll(/^\s{0,4}permissions:\s*\{([^}]+)\}/gmu)].map(
        (match) => match[1]?.trim(),
      ),
    ).toEqual(['contents: read', 'contents: read']);
    expect(workflow).not.toMatch(/id-token:\s*write/iu);
    expect(workflow).toMatch(
      /\n\s{2}operate:\n\s{4}if:\s*github\.ref == 'refs\/heads\/main'\s*$/mu,
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
    ).toEqual(['operate']);
    expect(workflow).not.toMatch(/self-hosted|wejammin/iu);
  });

  it('checks out the dispatched commit without credentials and runs the protected entrypoint once', () => {
    expect(operationStep).toBeDefined();
    const step = operationStep?.[0] ?? '';
    expect(workflow).toContain(
      'uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1',
    );
    expect(workflow).toContain('ref: ${{ github.sha }}');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('uses: ./.github/actions/setup');
    expect(step).toContain(
      'node --experimental-strip-types infra/workflows/run-ac265-outage-lease-control.ts',
    );
    expect(
      [...workflow.matchAll(/node --experimental-strip-types/g)].length,
    ).toBe(1);
    for (const expected of [
      'AC265_OUTAGE_LEASE_OPERATION: ${{ inputs.operation }}',
      'AC265_AUTHORIZATION_REF: ${{ inputs.authorization_ref }}',
      'AC265_TARGET_REF: ${{ inputs.target_ref }}',
      'AC265_IDEMPOTENCY_REF: ${{ inputs.idempotency_ref }}',
      'AC265_LEASE_REF: ${{ inputs.lease_ref }}',
      'AC265_LEASE_SHA256: ${{ inputs.lease_sha256 }}',
      'SUPABASE_URL: ${{ vars.SUPABASE_URL }}',
      'SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}',
      'SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}',
    ])
      expect(step).toContain(expected);
    expect(step).not.toMatch(/GITHUB_STEP_SUMMARY/u);
    expect(step).toMatch(/^\s{8}id: lease$/mu);
  });

  it('uploads exactly the redacted control record for one short-lived artifact', () => {
    expect(uploadStep).toBeDefined();
    const upload = uploadStep?.[0] ?? '';
    expect(upload).toContain(
      'uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a',
    );
    expect(upload).toContain(
      'name: ac265-outage-lease-${{ github.run_id }}-${{ github.run_attempt }}',
    );
    expect(
      [...upload.matchAll(/^\s{10}path:\s+(\S.*?)\s*$/gmu)].map(
        (match) => match[1],
      ),
    ).toEqual([
      '${{ runner.temp }}/ac265-outage-lease/outage-lease-control.json',
    ]);
    expect(upload).not.toMatch(/path:\s*\|/u);
    expect(upload).toContain('if-no-files-found: error');
    expect(upload).toContain('retention-days: 1');
    expect(upload).not.toMatch(/SUPABASE_SECRET_KEY|SUPABASE_URL/u);
    expect(workflow.match(/uses: actions\/upload-artifact@/g)).toHaveLength(1);
  });

  it('contains no outage exercise, deployment, or acceptance operation', () => {
    expect(workflow).not.toMatch(
      /\b(?:wrangler\s+deploy|supabase\s+db\s+(?:push|reset|migrate)|terraform\s+(?:apply|destroy)|kubectl\s+apply|npm\s+publish|playwright|inject|failover)\b/iu,
    );
    expect(workflow).not.toMatch(/\b(?:deploy|production|acceptance)\b/iu);
    expect(workflow.trimEnd().split(/\r?\n/u).length).toBeLessThanOrEqual(100);
  });
});
