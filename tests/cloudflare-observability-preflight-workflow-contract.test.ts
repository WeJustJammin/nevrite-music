import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/verify-production-cloudflare-observability.yml',
    import.meta.url,
  ),
  'utf8',
);

const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));

describe('production Cloudflare observability preflight workflow contract', () => {
  it('is an explicit exact-main verification only', () => {
    expect(workflowHeader).toContain('workflow_dispatch:');
    expect(workflowHeader).not.toContain('workflow_run:');
    expect(workflowHeader).not.toMatch(/\n\s+push:/u);
    expect(workflow).toMatch(
      /source_sha:\n\s+description:[\s\S]*?required: true\n\s+type: string/u,
    );
    expect(workflow).toMatch(
      /confirm_verification:\n\s+description:[\s\S]*?required: true\n\s+type: boolean\n\s+default: false/u,
    );
    const preflight = workflow.match(
      /\n\s{2}preflight:\n[\s\S]*?(?=\n\s{2}verify:)/u,
    )?.[0];
    expect(preflight).toBeDefined();
    expect(preflight).toContain(
      'CONFIRM_VERIFICATION: ${{ inputs.confirm_verification }}',
    );
    expect(preflight).toContain('SOURCE_SHA: ${{ inputs.source_sha }}');
    expect(preflight).toContain('DISPATCHED_SOURCE_SHA: ${{ github.sha }}');
    expect(preflight).toContain('test "$CONFIRM_VERIFICATION" = "true"');
    expect(preflight).toContain('test "$GITHUB_REF" = "refs/heads/main"');
    expect(preflight).toContain(
      'test "$SOURCE_SHA" = "$DISPATCHED_SOURCE_SHA"',
    );
    expect(preflight).toContain('GITHUB_TOKEN: ${{ github.token }}');
    expect(
      preflight?.match(
        /CONFIRM_VERIFICATION: \$\{\{ inputs\.confirm_verification \}\}/gu,
      ),
    ).toHaveLength(2);
    expect(
      preflight?.match(/SOURCE_SHA: \$\{\{ inputs\.source_sha \}\}/gu),
    ).toHaveLength(2);
    expect(preflight).toContain(
      'run: node --experimental-strip-types infra/workflows/verify-production-environment.ts',
    );
    expect(preflight).not.toMatch(/environment:/u);
    expect(preflight).not.toMatch(/secrets\./u);
  });

  it('uses the protected production environment and least privilege', () => {
    expect(workflow).toContain(
      'permissions: { actions: read, contents: read }',
    );
    expect(workflow).toContain('runs-on: [self-hosted, wejammin]');
    expect(workflow).toContain('environment: { name: production }');
    expect(workflow).toContain('timeout-minutes: 10');
    expect(workflow).toContain('cancel-in-progress: false');
    expect(workflow).toMatch(/\n\s{2}verify:\n\s+needs: preflight/u);
    expect(workflow).not.toMatch(/id-token:\s*write/u);
    expect(workflow).not.toMatch(/actions:\s*write/u);
  });

  it('checks out and verifies the exact dispatched revision', () => {
    expect(workflow).toContain(
      'uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7',
    );
    expect(workflow).toContain('ref: ${{ inputs.source_sha }}');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('checked_out_sha="$(git rev-parse HEAD)"');
    expect(workflow).toContain(
      'test "$checked_out_sha" = "$EXPECTED_SOURCE_REVISION"',
    );
    expect(workflow).toContain('test "$GITHUB_REF" = "refs/heads/main"');
    expect(workflow).not.toMatch(/GITHUB_ENVIRONMENT/u);
    const setupIndex = workflow.indexOf('uses: ./.github/actions/setup');
    const immutabilityIndex = workflow.indexOf(
      '- name: Reverify immutable workspace before secret use',
    );
    const verifierIndex = workflow.indexOf(
      '- name: Verify bounded Cloudflare monitoring capabilities',
    );
    expect(setupIndex).toBeGreaterThan(-1);
    expect(immutabilityIndex).toBeGreaterThan(setupIndex);
    expect(verifierIndex).toBeGreaterThan(immutabilityIndex);
    expect(workflow).toContain('git diff --quiet');
    expect(workflow).toContain('git diff --cached --quiet');
    expect(workflow).toContain(
      'test -z "$(git status --porcelain --untracked-files=all)"',
    );
  });

  it('runs only the existing bounded read-only capability verifier', () => {
    expect(workflow).toContain('uses: ./.github/actions/setup');
    expect(workflow).toContain(
      "CLOUDFLARE_ACCOUNT_ID: '${{ vars.CLOUDFLARE_ACCOUNT_ID }}'",
    );
    expect(workflow).toContain(
      "CLOUDFLARE_EMAIL_ZONE_ID: '${{ vars.CLOUDFLARE_EMAIL_ZONE_ID }}'",
    );
    expect(workflow).toContain(
      "CLOUDFLARE_OBSERVABILITY_API_TOKEN: '${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}'",
    );
    expect(
      workflow.match(
        /\$\{\{ secrets\.CLOUDFLARE_OBSERVABILITY_API_TOKEN \}\}/gu,
      ),
    ).toHaveLength(1);
    expect(workflowHeader).not.toMatch(/secrets\./u);
    expect(workflow).not.toMatch(/CLOUDFLARE_API_TOKEN:/u);
    expect(workflow).not.toMatch(/SUPABASE_/u);
    expect(workflow).toContain(
      'run: node --experimental-strip-types infra/verify-cloudflare-observability.ts',
    );
    expect(workflow).not.toMatch(/wrangler deploy/u);
    expect(workflow).not.toMatch(/apply-hosted-migrations/u);
    expect(workflow).not.toMatch(/deploy-api-worker/u);
    expect(workflow).not.toMatch(/exercise-production-ac209/u);
    expect(workflow).not.toMatch(/actions\/upload-artifact/u);
  });
});
