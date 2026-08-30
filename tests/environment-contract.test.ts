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
