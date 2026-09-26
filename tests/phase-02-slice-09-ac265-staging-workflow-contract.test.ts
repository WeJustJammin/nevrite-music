import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const WORKFLOW_PATH =
  '.github/workflows/verify-ac265-hosted-staging-evidence.yml';

describe('AC265 hosted staging-evidence workflow contract', () => {
  const workflow = readFileSync(WORKFLOW_PATH, 'utf8');

  it('runs only from main on the protected staging environment', () => {
    expect(workflow).toContain("if: github.ref == 'refs/heads/main'");
    expect(workflow).toContain('environment: staging');
    expect(workflow).toContain('runs-on: ubuntu-24.04');
  });

  it('grants exactly the read scopes the route needs', () => {
    expect(workflow).toContain('permissions: { contents: read }');
    expect(workflow).toContain('actions: read');
    expect(workflow).toContain('contents: read');
    expect(workflow).toContain('deployments: read');
  });

  it('takes the protected bundle from a secret with no dispatch override', () => {
    expect(workflow).toContain(
      'AC265_HOSTED_VERIFICATION_CONTEXT_BUNDLE_B64: ${{ secrets.AC265_HOSTED_VERIFICATION_CONTEXT_BUNDLE_B64 }}',
    );
    expect(workflow).not.toContain(
      'AC265_HOSTED_VERIFICATION_CONTEXT_BUNDLE_B64: ${{ inputs.',
    );
    expect(workflow).not.toContain(
      'AC265_HOSTED_VERIFICATION_CONTEXT_BUNDLE_B64: ${{ vars.',
    );
  });

  it('downloads the exact report artifact with digest enforcement', () => {
    expect(workflow).toContain(
      'artifact-ids: ${{ steps.resolve.outputs.report_artifact_id }}',
    );
    expect(workflow).toContain('digest-mismatch: error');
    expect(workflow).toContain('skip-decompress: true');
  });

  it('removes raw report bytes and uploads only the minimized manifest', () => {
    expect(workflow).toContain('Remove downloaded report bytes before upload');
    expect(workflow).toContain('rm -rf');
    expect(workflow).toContain(
      'path: ac265-hosted-staging-evidence/manifest.json',
    );
    expect(workflow).toContain('if-no-files-found: error');
    expect(workflow).not.toContain(
      'path: ac265-hosted-staging-evidence/report-archive',
    );
  });

  it('does not check out with persisted credentials or echo secrets', () => {
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).not.toContain('echo ${{ secrets.');
    expect(workflow).not.toContain('printenv');
  });
});
