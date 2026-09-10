import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL('../.github/workflows/collect-production-ac211.yml', import.meta.url),
  'utf8',
);

const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));
const preflight = workflow.match(
  /\n\s{2}preflight:\n[\s\S]*?(?=\n\s{2}collect:)/u,
)?.[0];
const collect = workflow.match(/\n\s{2}collect:\n[\s\S]*$/u)?.[0];

describe('production AC211 collection workflow contract', () => {
  it('runs count-only diagnosis before collection without replacing the evidence gate', () => {
    expect(collect).toContain('diagnose-content-schema-registry-slo.mjs');
    expect(
      collect?.indexOf('diagnose-content-schema-registry-slo.mjs'),
    ).toBeLessThan(
      collect?.indexOf('collect-content-schema-registry-slo-evidence.ts') ?? -1,
    );
    expect(collect).toContain(
      'AC211 diagnostic unavailable; normal collection still required.',
    );
  });
  it('is manual, explicit, main-only, and serialized without cancellation', () => {
    expect(workflowHeader).toContain('workflow_dispatch:');
    expect(workflowHeader).not.toMatch(
      /\b(schedule|push|pull_request|workflow_run):/u,
    );
    expect(workflow).toMatch(
      /utc_day:\n\s+description:[\s\S]*?required: true\n\s+type: string/u,
    );
    expect(workflow).toMatch(
      /source_revision:\n\s+description:[\s\S]*?required: true\n\s+type: string/u,
    );
    expect(workflow).toMatch(
      /production_deployment_id:\n\s+description:[\s\S]*?required: true\n\s+type: string/u,
    );
    expect(workflow).toMatch(
      /confirm_collection:\n\s+description:[\s\S]*?required: true\n\s+type: boolean\n\s+default: false/u,
    );
    expect(workflow).toContain(
      'concurrency: { group: collect-production-ac211, cancel-in-progress: false }',
    );
    expect(workflow).toContain(
      'permissions: { actions: read, contents: read, deployments: read }',
    );
    expect(preflight).toBeDefined();
    expect(preflight).toMatch(
      /if: inputs\.confirm_collection == true && github\.ref == 'refs\/heads\/main'/u,
    );
  });

  it('verifies the selected source before entering protected production', () => {
    expect(preflight).toBeDefined();
    expect(preflight).toMatch(/runs-on: \[self-hosted, wejammin\]/u);
    expect(preflight).toMatch(/actions\/checkout@[0-9a-f]{40}/u);
    expect(preflight).toMatch(/ref: \$\{\{ github\.sha \}\}/u);
    expect(preflight).toContain('uses: ./.github/actions/setup');
    expect(preflight).toContain(
      'node --experimental-strip-types infra/workflows/verify-content-schema-registry-slo-source.ts',
    );
    expect(preflight).toContain('GITHUB_TOKEN: ${{ github.token }}');
    expect(preflight).not.toMatch(/^\s+environment:/mu);
    expect(preflight).toMatch(/outputs:\n(?:\s{6}.+\n){6}/u);
    expect(collect).toBeDefined();
    expect(collect).toMatch(/needs: preflight/u);
    expect(collect).toContain('environment:\n      name: production');
  });

  it('passes only protected provider credentials and verified identities to the collector', () => {
    expect(collect).toBeDefined();
    for (const variable of [
      'CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}',
      'CLOUDFLARE_PLATFORM_QUEUE_ID: ${{ vars.CLOUDFLARE_PLATFORM_QUEUE_ID }}',
      'CLOUDFLARE_OBSERVABILITY_API_TOKEN: ${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}',
    ]) {
      expect(collect).toContain(variable);
    }
    expect(collect).not.toContain('CLOUDFLARE_API_TOKEN');
    expect(collect).toContain(
      'SOURCE_REVISION: ${{ needs.preflight.outputs.source_revision }}',
    );
    expect(collect).toContain(
      'PRODUCTION_DEPLOYMENT_ID: ${{ needs.preflight.outputs.production_deployment_id }}',
    );
    for (const output of [
      'WINDOW_START: ${{ needs.preflight.outputs.window_start }}',
      'WINDOW_END: ${{ needs.preflight.outputs.window_end }}',
      'PRODUCTION_DEPLOYED_AT: ${{ needs.preflight.outputs.production_deployed_at }}',
      'QUERY_ID: ${{ needs.preflight.outputs.query_id }}',
    ]) {
      expect(collect).toContain(output);
    }
  });

  it('runs the read-only collector and retains only its bounded report directory', () => {
    expect(collect).toBeDefined();
    expect(collect).toMatch(/runs-on: \[self-hosted, wejammin\]/u);
    expect(collect).toContain(
      'collect-content-schema-registry-slo-evidence.ts',
    );
    expect(collect).toContain('AC211_REPORT_DIR: ac211-reports');
    expect(collect).not.toMatch(/if: always\(\)/u);
    const upload = collect.match(
      /uses: actions\/upload-artifact@[0-9a-f]{40}[\s\S]*$/u,
    )?.[0];
    expect(upload).toBeDefined();
    expect(upload).toContain('path: ac211-reports');
    expect(upload).toContain('retention-days: 30');
    expect(upload).not.toMatch(/path:\s*\./u);
  });

  it('contains no deployment, migration, Wrangler, or Supabase operation', () => {
    expect(workflow).not.toMatch(/\b(wrangler|supabase)\b/iu);
    expect(workflow).not.toMatch(/^\s+run:.*\b(deploy|migration)\b/im);
    expect(workflow).not.toMatch(/apply-hosted-migrations|deploy-api-worker/u);
    expect(workflow.trimEnd().split('\n').length).toBeLessThanOrEqual(100);
  });
});
