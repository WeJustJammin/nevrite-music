import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL('../.github/workflows/deploy-production.yml', import.meta.url),
  'utf8',
);
const candidateVerifier = readFileSync(
  new URL('../infra/workflows/verify-production-candidate.sh', import.meta.url),
  'utf8',
);
const candidateReader = readFileSync(
  new URL('../infra/workflows/read-production-candidate.sh', import.meta.url),
  'utf8',
);

const workflowHeader = workflow.slice(0, workflow.indexOf('\njobs:'));

describe('production promotion workflow contract', () => {
  it('requires an explicit operator dispatch and never follows staging automatically', () => {
    expect(workflowHeader).toContain('workflow_dispatch:');
    expect(workflowHeader).not.toContain('workflow_run:');
    expect(workflow).toMatch(
      /staging_run_id:\n\s+description:[\s\S]*?required: true\n\s+type: string/u,
    );
    expect(workflow).toMatch(
      /source_sha:\n\s+description:[\s\S]*?required: true\n\s+type: string/u,
    );
    expect(workflow).toMatch(
      /confirm_production:\n\s+description:[\s\S]*?required: true\n\s+type: boolean\n\s+default: false/u,
    );
    expect(workflow).toMatch(
      /if: inputs\.confirm_production == true && github\.ref == 'refs\/heads\/main'/u,
    );
  });

  it('validates staging identity and production protection before entering the environment', () => {
    const preflight = workflow.match(
      /\n\s{2}preflight:\n[\s\S]*?(?=\n\s{2}deploy:)/u,
    )?.[0];

    expect(preflight).toBeDefined();
    expect(preflight).toMatch(/verify-production-promotion\.ts/u);
    expect(preflight).toMatch(/STAGING_RUN_ID:.*inputs\.staging_run_id/u);
    expect(preflight).toMatch(/DEPLOY_SHA:.*inputs\.source_sha/u);
    expect(preflight).toMatch(/GITHUB_TOKEN:.*github\.token/u);
    expect(preflight).not.toMatch(/environment:/u);

    const deploy = workflow.match(/\n\s{2}deploy:\n[\s\S]*?(?=\n\s*$)/u)?.[0];
    expect(deploy).toBeDefined();
    expect(deploy).toMatch(/needs: preflight/u);
    expect(deploy).toMatch(/name: production/u);
    expect(deploy).toMatch(
      /if: inputs\.confirm_production == true && github\.ref == 'refs\/heads\/main' && needs\.preflight\.result == 'success'/u,
    );
  });

  it('propagates only the API-verified CI identity and compares an independent sidecar', () => {
    const preflight = workflow.match(
      /\n\s{2}preflight:\n[\s\S]*?(?=\n\s{2}deploy:)/u,
    )?.[0];

    expect(preflight).toMatch(
      /outputs:\s*\n\s+ci_run_id:\s+\$\{\{ steps\.verify\.outputs\.ci_run_id \}\}/u,
    );
    expect(preflight).toMatch(/id: verify/u);
    expect(workflow).toMatch(
      /CI_RUN_ID: '?\$\{\{ needs\.preflight\.outputs\.ci_run_id \}\}'?/u,
    );
    expect(candidateVerifier).toMatch(/staging-artifact-identity\.json/u);
    expect(candidateVerifier.indexOf('sha256sum --check')).toBeLessThan(
      candidateVerifier.indexOf('staging-artifact-identity.json'),
    );
    expect(workflow).toMatch(
      /candidate \.promotion\/staging-artifact-identity\.json/u,
    );
    expect(workflow).toMatch(
      /production \.promotion\/staging-artifact-identity\.json/u,
    );
    expect(workflow).toMatch(/\.promotion\/\*\.json/u);
    expect(candidateReader).not.toMatch(
      /sed\s+-n\s+['"]s\/\.\*"(?:sourceRevision|buildId|artifactDigest|migrationVersion)/u,
    );
    expect(candidateVerifier).not.toMatch(
      /sed\s+-n\s+['"]s\/\.\*"(?:sourceRevision|buildId|artifactDigest|migrationVersion)/u,
    );
  });

  it('downloads the candidate from the operator-selected staging run and checks its source SHA', () => {
    expect(workflow).toMatch(/DEPLOY_SHA: \$\{\{ inputs\.source_sha \}\}/u);
    expect(workflow).toMatch(
      /STAGING_RUN_ID: \$\{\{ inputs\.staging_run_id \}\}/u,
    );
    expect(workflow).toMatch(/run-id: \$\{\{ env\.STAGING_RUN_ID \}\}/u);
    expect(workflow).toMatch(/ref: \$\{\{ env\.DEPLOY_SHA \}\}/u);
    expect(workflow).toMatch(/read-production-candidate\.sh/u);
    expect(workflow).toMatch(/promotion-metadata\.json/u);
    expect(candidateVerifier).toMatch(/sha256sum --check/u);
  });

  it('revalidates candidate metadata before production migrations', () => {
    const artifactBoundaryIndex = workflow.indexOf(
      'bash infra/workflows/verify-production-candidate.sh',
    );
    const candidateMetadataIndex = workflow.indexOf(
      'node --experimental-strip-types infra/verify-release-promotion.ts .promotion/promotion-metadata.json candidate .promotion/staging-artifact-identity.json',
    );
    const migrationIndex = workflow.indexOf(
      '- name: Apply and verify forward-only production migrations',
    );

    expect(artifactBoundaryIndex).toBeGreaterThan(-1);
    expect(candidateMetadataIndex).toBeGreaterThan(artifactBoundaryIndex);
    expect(candidateMetadataIndex).toBeLessThan(migrationIndex);
    expect(candidateVerifier).toContain(
      '.promotion/staging-migration-evidence.json',
    );
    expect(candidateVerifier).toContain(
      'verify-staging-migration-evidence.mjs',
    );
    expect(workflow).toContain(
      "EXPECTED_STAGING_SUPABASE_PROJECT_REF: '${{ vars.STAGING_SUPABASE_PROJECT_REF }}'",
    );
    expect(candidateVerifier).toContain(
      '"$EXPECTED_STAGING_SUPABASE_PROJECT_REF"',
    );
  });

  it('labels retained deployment evidence with the terminal job status', () => {
    expect(workflow).toContain(
      'name: production-deployment-attempt-${{ env.DEPLOY_SHA }}-${{ job.status }}',
    );
    expect(workflow).not.toContain(
      'name: production-deployment-${{ env.DEPLOY_SHA }}',
    );
  });
});
