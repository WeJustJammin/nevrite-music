import { existsSync, readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

type JsonObject = Record<string, unknown>;

const parseJsonc = (source: string): JsonObject =>
  JSON.parse(
    source
      .replace(/\/\*[\s\S]*?\*\//gu, '')
      .replace(/^\s*\/\/.*$/gmu, '')
      .replace(/,\s*([}\]])/gu, '$1'),
  ) as JsonObject;

const readWrangler = (): JsonObject =>
  parseJsonc(
    readFileSync(
      new URL('../apps/worker/wrangler.jsonc', import.meta.url),
      'utf8',
    ),
  );

const readWorkflow = (name: string): string =>
  readFileSync(
    new URL(`../.github/workflows/${name}`, import.meta.url),
    'utf8',
  );

const apiDeploymentScript = readFileSync(
  new URL('../infra/workflows/deploy-api-worker.sh', import.meta.url),
  'utf8',
);

const lineCount = (contents: string): number => contents.split(/\r?\n/u).length;

const asObject = (value: unknown, label: string): JsonObject => {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(`${label} must be an object`);
  }
  return value as JsonObject;
};

describe('immutable release identity contract', () => {
  it('keeps the local fallback while requiring remote deployment injection', () => {
    const config = readWrangler();
    const rootVars = asObject(config.vars, 'vars');
    const environments = asObject(config.env, 'env');
    const localVars = asObject(
      asObject(environments.local, 'env.local').vars,
      'env.local.vars',
    );
    const stagingVars = asObject(
      asObject(environments.staging, 'env.staging').vars,
      'env.staging.vars',
    );

    expect(localVars.APP_RELEASE).toBe('local');
    expect(rootVars.APP_RELEASE).toBeUndefined();
    expect(stagingVars.APP_RELEASE).toBeUndefined();
  });

  it('builds CI artifacts under the exact source commit identity', () => {
    const workflow = readWorkflow('ci.yml');

    expect(lineCount(workflow)).toBeLessThanOrEqual(100);
    expect(workflow).toMatch(/push:\n {4}branches: \[main\]/u);
    expect(workflow).toMatch(/pull_request:\n {4}branches:\n {6}- main/u);
    expect(workflow).toContain('group: ci-${{ github.repository }}');
    expect(workflow).toContain('cancel-in-progress: false');
    expect(workflow).toMatch(/name: workspace-build-\$\{\{ github\.sha \}\}/u);
    expect(workflow).toMatch(/apps\/worker\/dist\//u);
  });

  it('injects the verified promoted SHA into staging runtime metadata', () => {
    const workflow = readWorkflow('deploy-staging.yml');
    const verificationScript = readFileSync(
      new URL(
        '../infra/workflows/verify-staging-artifacts.sh',
        import.meta.url,
      ),
      'utf8',
    );
    const evidenceScript = readFileSync(
      new URL(
        '../infra/workflows/finalize-staging-candidate.sh',
        import.meta.url,
      ),
      'utf8',
    );
    const candidateScript = readFileSync(
      new URL(
        '../infra/workflows/prepare-staging-candidate.sh',
        import.meta.url,
      ),
      'utf8',
    );
    const performanceVerifier = readFileSync(
      new URL(
        '../infra/workflows/verify-performance-evidence.ts',
        import.meta.url,
      ),
      'utf8',
    );

    expect(workflow).not.toContain('workflow_dispatch:');
    expect(lineCount(workflow)).toBeLessThanOrEqual(100);
    expect(workflow).toMatch(/DEPLOY_SHA:.*workflow_run\.head_sha/u);
    expect(verificationScript).toMatch(/DEPLOY_SHA" =~ \^\[0-9a-f\]\{40\}\$/u);
    expect(verificationScript).toMatch(
      /test "\$\(git rev-parse HEAD\)" = "\$DEPLOY_SHA"/u,
    );
    expect(workflow).toMatch(
      /name: workspace-build-\$\{\{ env\.DEPLOY_SHA \}\}/u,
    );
    expect(workflow).toMatch(/deploy-api-worker\.sh staging/u);
    expect(apiDeploymentScript).toMatch(/--var APP_RELEASE:"\$DEPLOY_SHA"/u);
    expect(workflow).toMatch(/pnpm verify:staging/u);
    expect(workflow).toMatch(/name: staging-verified-candidate/u);
    expect(candidateScript).toMatch(/promotion-candidate\/artifacts/u);
    expect(workflow).toMatch(/promotion-metadata\.json/u);
    expect(evidenceScript).toMatch(/artifactDigest/u);
    expect(workflow).toMatch(
      /bash infra\/workflows\/record-staging-artifacts\.sh/u,
    );
    expect(workflow).toMatch(/verify-staging-run\.mjs/u);
    expect(verificationScript).toMatch(/verify-performance-evidence\.ts/u);
    expect(evidenceScript).toMatch(/performance-evidence/u);
    expect(evidenceScript).toMatch(/api-p95-smoke\.json/u);
    expect(performanceVerifier).toMatch(/source revision/u);
    expect(workflow).toMatch(
      /bash infra\/workflows\/finalize-staging-candidate\.sh/u,
    );
    expect(workflow.indexOf('pnpm verify:staging')).toBeLessThan(
      workflow.indexOf('Finalize staging promotion evidence'),
    );
    expect(
      workflow.indexOf('Finalize staging promotion evidence'),
    ).toBeLessThan(workflow.indexOf('Verify release promotion evidence'));
    expect(workflow.indexOf('Verify release promotion evidence')).toBeLessThan(
      workflow.indexOf('name: staging-verified-candidate'),
    );
    expect(workflow.indexOf('CLOUDFLARE_API_TOKEN')).toBeGreaterThan(
      workflow.indexOf('name: Set up workspace'),
    );
    const jobSetup = workflow.match(/jobs:[\s\S]*?\n {4}steps:/u)?.[0] ?? '';
    expect(jobSetup).not.toContain('CLOUDFLARE_API_TOKEN');
  });

  it('defines a protected production promotion with the same immutable injection', () => {
    const workflowPath = new URL(
      '../.github/workflows/deploy-production.yml',
      import.meta.url,
    );

    expect(existsSync(workflowPath)).toBe(true);
    if (!existsSync(workflowPath)) return;

    const workflow = readFileSync(workflowPath, 'utf8');
    const verificationScript = readFileSync(
      new URL(
        '../infra/workflows/verify-production-candidate.sh',
        import.meta.url,
      ),
      'utf8',
    );
    const performanceVerifier = readFileSync(
      new URL(
        '../infra/workflows/verify-performance-evidence.ts',
        import.meta.url,
      ),
      'utf8',
    );
    const identityScript = readFileSync(
      new URL(
        '../infra/workflows/read-production-candidate.sh',
        import.meta.url,
      ),
      'utf8',
    );

    expect(lineCount(workflow)).toBeLessThanOrEqual(100);
    expect(workflow).not.toMatch(/workflows: \[CI\]/u);
    expect(workflow).toMatch(/workflow_dispatch:/u);
    expect(workflow).not.toMatch(/workflow_run:/u);
    expect(workflow).toMatch(
      /if: inputs\.confirm_production == true && github\.ref == 'refs\/heads\/main'/u,
    );
    expect(workflow).toMatch(/name: production/u);
    expect(workflow).toMatch(/STAGING_RUN_ID:.*inputs\.staging_run_id/u);
    expect(workflow).toMatch(/DEPLOY_SHA:.*inputs\.source_sha/u);
    expect(workflow).toMatch(/verify-production-promotion\.ts/u);
    expect(workflow).toMatch(/name: staging-verified-candidate/u);
    expect(workflow).toMatch(/run-id: \$\{\{ env\.STAGING_RUN_ID \}\}/u);
    expect(workflow).toMatch(/promotion-metadata\.json/u);
    expect(verificationScript).toMatch(/artifactDigest/u);
    expect(verificationScript).toMatch(/sha256sum --check/u);
    expect(verificationScript).toMatch(/verify-performance-evidence\.ts/u);
    expect(performanceVerifier).toMatch(/ReleasePerformanceEvidenceSchema/u);
    expect(workflow).toMatch(/verify-release-promotion\.ts/u);
    expect(identityScript).toMatch(/DEPLOY_SHA" =~ \^\[0-9a-f\]\{40\}\$/u);
    expect(workflow).toMatch(/ref: \$\{\{ env\.DEPLOY_SHA \}\}/u);
    const checkoutIndex = workflow.indexOf(
      '- name: Check out the promoted revision',
    );
    const downloadIndex = workflow.indexOf(
      '- name: Download staging-verified promotion candidate',
    );
    const identityIndex = workflow.indexOf(
      '- name: Read and validate promotion identity',
    );
    expect(checkoutIndex).toBeGreaterThan(-1);
    expect(checkoutIndex).toBeLessThan(downloadIndex);
    expect(downloadIndex).toBeLessThan(identityIndex);
    expect(identityIndex).toBeLessThan(
      workflow.indexOf('- name: Set up workspace'),
    );
    expect(workflow).not.toMatch(/name: workspace-build-/u);
    expect(workflow).toMatch(/deploy-api-worker\.sh production/u);
    expect(apiDeploymentScript).toMatch(
      /--var APP_ENVIRONMENT:"\$task_environment"/u,
    );
    expect(apiDeploymentScript).toMatch(/--var APP_RELEASE:"\$DEPLOY_SHA"/u);
    expect(workflow.indexOf('CLOUDFLARE_API_TOKEN')).toBeGreaterThan(
      workflow.indexOf('name: Set up workspace'),
    );
    const jobSetup = workflow.match(/jobs:[\s\S]*?\n {4}steps:/u)?.[0] ?? '';
    expect(jobSetup).not.toContain('CLOUDFLARE_API_TOKEN');
  });

  it('applies forward-only migrations and verifies explicit protected approval', () => {
    const workflow = readWorkflow('deploy-production.yml');
    const migrationScript = readFileSync(
      new URL('../infra/workflows/apply-hosted-migrations.sh', import.meta.url),
      'utf8',
    );
    const verifier = readFileSync(
      new URL('../infra/verify-release-promotion.ts', import.meta.url),
      'utf8',
    );

    expect(workflow).toMatch(
      /bash infra\/workflows\/apply-hosted-migrations\.sh/u,
    );
    expect(migrationScript).toMatch(/export SUPABASE_DB_PASSWORD/u);
    expect(migrationScript).toMatch(
      /supabase db push --project-ref "\$SUPABASE_PROJECT_REF" --yes/u,
    );
    expect(migrationScript).toMatch(
      /supabase migration list --project-ref "\$SUPABASE_PROJECT_REF"/u,
    );
    expect(migrationScript).not.toMatch(/--password\b/u);
    expect(workflow).toMatch(/RELEASE_PROTECTED_ENVIRONMENT: production/u);
    expect(verifier).not.toContain('protectedApproval: true');
    expect(
      workflow.indexOf('Apply and verify forward-only production migrations'),
    ).toBeLessThan(workflow.indexOf('Deploy API Worker production artifact'));
  });

  it('carries successful CI gate evidence into staging and production', () => {
    const ciWorkflow = readWorkflow('ci.yml');
    const stagingFinalizer = readFileSync(
      new URL(
        '../infra/workflows/finalize-staging-candidate.sh',
        import.meta.url,
      ),
      'utf8',
    );
    const gateWriter = readFileSync(
      new URL('../infra/workflows/write-ci-gate-evidence.sh', import.meta.url),
      'utf8',
    );
    const gateVerifier = readFileSync(
      new URL('../infra/workflows/verify-ci-release-gates.sh', import.meta.url),
      'utf8',
    );

    expect(ciWorkflow).toMatch(/ci-gate-evidence\.json/u);
    const stagingVerifier = readFileSync(
      new URL(
        '../infra/workflows/verify-staging-artifacts.sh',
        import.meta.url,
      ),
      'utf8',
    );
    expect(stagingVerifier).toMatch(/ci-gate-evidence\.json/u);
    expect(stagingFinalizer).toMatch(/ci-gate-evidence\.json/u);
    expect(stagingFinalizer).not.toMatch(/"contracts":true/u);
    expect(stagingFinalizer).toMatch(/staging-verification\.passed/u);
    expect(gateWriter).toMatch(/QUALITY_RESULT/u);
    expect(gateWriter).toMatch(/DATABASE_RESULT/u);
    expect(gateVerifier).toMatch(/pnpm contracts:check/u);
    expect(gateVerifier).toMatch(/provider-effect-configuration\.test\.ts/u);
    expect(gateVerifier).toMatch(/docs\/runbooks\/platform\/slo\.md/u);
  });
});
