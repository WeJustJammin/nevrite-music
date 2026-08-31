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
});
