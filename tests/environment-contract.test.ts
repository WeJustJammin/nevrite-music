import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const rootEnvironment = readFileSync(
  new URL('../.env.example', import.meta.url),
  'utf8',
);
const workerEnvironment = readFileSync(
  new URL('../apps/worker/.dev.vars.example', import.meta.url),
  'utf8',
);
const deploymentContract = readFileSync(
  new URL('../.github/SECRETS.md', import.meta.url),
  'utf8',
);
const workerConfiguration = readFileSync(
  new URL('../apps/worker/wrangler.jsonc', import.meta.url),
  'utf8',
);
const stagingDeploymentWorkflow = readFileSync(
  new URL('../.github/workflows/deploy-staging.yml', import.meta.url),
  'utf8',
);
const apiDeploymentScript = readFileSync(
  new URL('../infra/workflows/deploy-api-worker.sh', import.meta.url),
  'utf8',
);
const ciWorkflow = readFileSync(
  new URL('../.github/workflows/ci.yml', import.meta.url),
  'utf8',
);

describe('Supabase environment contract', () => {
  it('uses rotatable secret keys instead of the legacy service-role JWT', () => {
    expect(rootEnvironment).toContain(
      'SUPABASE_SECRET_KEY=replace_in_secret_store',
    );
    expect(workerEnvironment).toContain(
      'SUPABASE_SECRET_KEY=replace_locally_only',
    );
    expect(deploymentContract).toContain('`SUPABASE_SECRET_KEY`');

    expect(rootEnvironment).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(workerEnvironment).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(deploymentContract).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
  });
});

describe('Worker runtime environment contract', () => {
  it('keeps runtime identity in local and Cloudflare configuration', () => {
    expect(workerEnvironment).toContain('APP_ENVIRONMENT=development');
    expect(workerEnvironment).toContain('APP_RELEASE=local');
    expect(workerConfiguration).toContain('"APP_ENVIRONMENT": "production"');
    expect(workerConfiguration).toContain('"APP_ENVIRONMENT": "staging"');
    expect(workerConfiguration).toContain('"APP_RELEASE": "local"');
    expect(workerConfiguration).toContain('"PLATFORM_ALERT_EMAIL"');
    expect(workerConfiguration).toContain(
      '"destination_address": "admin.wejammin@gmail.com"',
    );
    expect(workerConfiguration).toContain('"head_sampling_rate": 1');
  });

  it('keeps immutable staging promotion and runtime identity', () => {
    expect(stagingDeploymentWorkflow).toContain('name: staging');
    expect(stagingDeploymentWorkflow).toContain(
      'name: Promote immutable artifacts to staging',
    );
    expect(stagingDeploymentWorkflow).toContain(
      'name: Record promoted artifact digests',
    );
    expect(stagingDeploymentWorkflow).toContain(
      'Deploy web SSR Worker staging artifact',
    );
    expect(stagingDeploymentWorkflow).toContain(
      'Deploy API Worker staging artifact',
    );
    expect(stagingDeploymentWorkflow).toContain('wrangler.staging.json');
    expect(stagingDeploymentWorkflow).toContain(
      '--domain "$WEB_CUSTOM_DOMAIN"',
    );
    expect(stagingDeploymentWorkflow).toContain(
      'bash infra/workflows/deploy-api-worker.sh staging',
    );
    expect(apiDeploymentScript).toContain(
      '--var APP_ENVIRONMENT:"$task_environment"',
    );
    expect(apiDeploymentScript).toContain('--var APP_RELEASE:"$DEPLOY_SHA"');
    expect(apiDeploymentScript).toContain('--var SUPABASE_URL:"$SUPABASE_URL"');
    expect(apiDeploymentScript).toContain(
      '--var CLOUDFLARE_ACCOUNT_ID:"$CLOUDFLARE_ACCOUNT_ID"',
    );
    expect(apiDeploymentScript).toContain(
      'CLOUDFLARE_OBSERVABILITY_API_TOKEN=',
    );
    expect(apiDeploymentScript).toContain(
      '--secrets-file "$task_secrets_file"',
    );
    expect(apiDeploymentScript).not.toContain('--var SUPABASE_SECRET_KEY:');
    expect(ciWorkflow).toContain('Upload immutable build artifacts');
  });
});
