import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const readRepositoryFile = (path: string): string =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

describe('staging migration workflow contract', () => {
  it('applies the candidate migration before either staging deployment', () => {
    const workflow = readRepositoryFile('.github/workflows/deploy-staging.yml');
    const recordIndex = workflow.indexOf('Record promoted artifact digests');
    const migrationIndex = workflow.indexOf(
      'Apply and verify forward-only staging migrations',
    );

    expect(recordIndex).toBeGreaterThan(-1);
    expect(migrationIndex).toBeGreaterThan(recordIndex);
    expect(migrationIndex).toBeLessThan(
      workflow.indexOf('Deploy API Worker staging artifact'),
    );
    expect(migrationIndex).toBeLessThan(
      workflow.indexOf('Deploy web SSR Worker staging artifact'),
    );
  });

  it('keeps database credentials step-scoped and fails closed through the hosted runner', () => {
    const workflow = readRepositoryFile('.github/workflows/deploy-staging.yml');
    const migrationStep = workflow.match(
      /- name: Apply and verify forward-only staging migrations[\s\S]*?(?=\n {6}- name:)/u,
    )?.[0];
    const jobSetup = workflow.match(/jobs:[\s\S]*?\n {4}steps:/u)?.[0] ?? '';

    expect(migrationStep).toContain(
      'SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}',
    );
    expect(migrationStep).toContain(
      'SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}',
    );
    expect(migrationStep).toContain(
      'SUPABASE_PROJECT_REF: ${{ vars.SUPABASE_PROJECT_REF }}',
    );
    expect(migrationStep).toContain(
      'STAGING_MIGRATION_EVIDENCE_PATH: promotion-candidate/staging-migration-evidence.json',
    );
    expect(migrationStep).toContain(
      'bash infra/workflows/apply-hosted-migrations.sh',
    );
    expect(jobSetup).not.toContain('SUPABASE_ACCESS_TOKEN');
    expect(jobSetup).not.toContain('SUPABASE_DB_PASSWORD');
  });

  it('verifies remote parity and records forward-only expansion evidence', () => {
    const script = readRepositoryFile(
      'infra/workflows/apply-hosted-migrations.sh',
    );

    expect(script).toContain(
      ': "${SUPABASE_ACCESS_TOKEN:?SUPABASE_ACCESS_TOKEN is required}"',
    );
    expect(script).toContain('export SUPABASE_DB_PASSWORD');
    expect(script).toMatch(
      /supabase db push --project-ref "\$SUPABASE_PROJECT_REF" --yes/u,
    );
    expect(script).toMatch(
      /supabase migration list --project-ref "\$SUPABASE_PROJECT_REF"/u,
    );
    expect(script).toContain("state: 'expanded'");
    expect(script).toContain('forwardFixOnly: true');
    expect(script).toContain('destructiveRollbackAttempted: false');
    expect(script).not.toMatch(/--password\b|db reset|migration repair/u);
  });

  it('requires verified staging migration evidence before finalizing a candidate', () => {
    const workflow = readRepositoryFile('.github/workflows/deploy-staging.yml');
    const finalizer = readRepositoryFile(
      'infra/workflows/finalize-staging-candidate.sh',
    );
    const verifier = readRepositoryFile(
      'infra/workflows/verify-staging-migration-evidence.mjs',
    );

    expect(finalizer).toContain(
      'promotion-candidate/staging-migration-evidence.json',
    );
    expect(finalizer).toContain('verify-staging-migration-evidence.mjs');
    expect(finalizer).toContain('[0-9]\\{14,20\\}');
    expect(verifier).toContain('appliedVersions');
    expect(verifier).toContain('remoteHistorySha256');
    expect(workflow).toMatch(
      /name: Finalize staging promotion evidence[\s\S]*?SUPABASE_PROJECT_REF: \$\{\{ vars\.SUPABASE_PROJECT_REF \}\}/u,
    );
  });

  it('retains successful migration evidence when a later deployment step fails', () => {
    const workflow = readRepositoryFile('.github/workflows/deploy-staging.yml');
    const evidenceUpload = workflow.match(
      /- name: Upload deployment evidence[\s\S]*$/u,
    )?.[0];

    expect(evidenceUpload).toMatch(/always\(\).*hashFiles\(/u);
    expect(evidenceUpload).toContain('deployment-manifest.sha256');
    expect(evidenceUpload).toContain(
      'promotion-candidate/staging-migration-evidence.json',
    );
  });
});
