import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/diagnose-production-ac209-email.yml',
    import.meta.url,
  ),
  'utf8',
);

const header = workflow.slice(0, workflow.indexOf('\njobs:'));
const diagnose = workflow.match(/\n\s{2}diagnose:\n[\s\S]*$/u)?.[0] ?? '';

describe('production AC209 email diagnostic workflow contract', () => {
  it('is an explicit confirmed main-only manual diagnostic', () => {
    expect(header).toContain('workflow_dispatch:');
    expect(header).not.toMatch(
      /\n\s+(schedule|push|pull_request|workflow_run|release):/u,
    );
    for (const input of ['source_revision', 'window_start', 'window_end'])
      expect(header).toMatch(
        new RegExp(
          `${input}:\n\\s+description:[\\s\\S]*?required: true\\n\\s+type: string`,
          'u',
        ),
      );
    expect(header).toMatch(
      /confirm_diagnostic:\n\s+description:[\s\S]*?required: true\n\s+type: boolean\n\s+default: false/u,
    );
    expect(workflow).toMatch(
      /if: inputs\.confirm_diagnostic == true && github\.ref == 'refs\/heads\/main'/u,
    );
    expect(workflow).toContain(
      'concurrency:\n  group: diagnose-production-ac209-email\n  cancel-in-progress: false',
    );
    expect(workflow).toContain('permissions: { contents: read }');
    expect(workflow).not.toMatch(/id-token:\s*write/u);
    expect(workflow).not.toMatch(/actions:\s*write/u);
  });

  it('verifies the dispatched revision before any protected secret is read', () => {
    expect(workflow).toMatch(/actions\/checkout@[0-9a-f]{40}/u);
    expect(workflow).toContain('ref: ${{ inputs.source_revision }}');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain(
      'test "$SOURCE_REVISION" = "$DISPATCHED_SOURCE_SHA"',
    );
    expect(workflow).toContain('checked_out_sha="$(git rev-parse HEAD)"');
    expect(workflow).toContain(
      'test "$checked_out_sha" = "$EXPECTED_SOURCE_REVISION"',
    );
    expect(workflow).toContain('git diff --quiet');
    expect(workflow).toContain('git diff --cached --quiet');
    expect(workflow).toContain(
      'test -z "$(git status --porcelain --untracked-files=all)"',
    );
    const secretIndex = workflow.indexOf('CLOUDFLARE_OBSERVABILITY_API_TOKEN:');
    expect(
      workflow.indexOf('Set up pinned workspace dependencies'),
    ).toBeLessThan(
      workflow.indexOf('Reverify immutable workspace before secret use'),
    );
    expect(
      workflow.indexOf('Reverify immutable workspace before secret use'),
    ).toBeLessThan(secretIndex);
  });

  it('uses only the protected production environment and its read-only credentials', () => {
    expect(workflow).toContain('environment: { name: production }');
    expect(workflow).toContain('runs-on: [self-hosted, wejammin]');
    expect(workflow).toMatch(/\n\s{2}diagnose:\n\s+needs: preflight/u);
    expect(diagnose).toContain(
      "CLOUDFLARE_EMAIL_ZONE_ID: '${{ vars.CLOUDFLARE_EMAIL_ZONE_ID }}'",
    );
    expect(diagnose).toContain(
      "CLOUDFLARE_OBSERVABILITY_API_TOKEN: '${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}'",
    );
    expect(diagnose).toContain(
      "EXPECTED_ALERT_SENDER_SHA256: '${{ vars.PRODUCTION_ALERT_SENDER_SHA256 }}'",
    );
    expect(diagnose).toContain(
      "EXPECTED_ALERT_EMAIL_SHA256: '${{ vars.PRODUCTION_ALERT_EMAIL_SHA256 }}'",
    );
    expect(
      workflow.match(
        /\$\{\{ secrets\.CLOUDFLARE_OBSERVABILITY_API_TOKEN \}\}/gu,
      ),
    ).toHaveLength(1);
    expect(workflow).not.toMatch(/secrets\.CLOUDFLARE_API_TOKEN/u);
    expect(workflow).not.toMatch(/secrets\.CLOUDFLARE_QUEUE_EXERCISE_TOKEN/u);
    expect(workflow).not.toMatch(/SUPABASE_/u);
    expect(header).not.toMatch(/secrets\./u);
  });

  it('runs only the bounded read-only diagnostic entrypoint', () => {
    expect(workflow).toContain(
      'node --experimental-strip-types infra/workflows/diagnose-production-ac209-email.ts',
    );
    // The corroboration probe shares the one token-bearing step, so the
    // credential stays referenced exactly once and no probe can run before the
    // immutable-workspace reverification.
    expect(workflow).toContain(
      'node --experimental-strip-types infra/workflows/probe-production-ac209-sending-groups.ts',
    );
    expect(workflow).not.toMatch(/exercise-production-ac209/u);
    expect(workflow).not.toMatch(/cleanup-production-ac209/u);
    expect(workflow).not.toMatch(/collect-production-ac209/u);
    expect(workflow).not.toMatch(/wrangler deploy/u);
    expect(workflow).not.toMatch(/apply-hosted-migrations/u);
    expect(workflow).not.toMatch(/deploy-api-worker/u);
    expect(workflow).not.toMatch(/gh workflow run/u);
    expect(workflow).not.toMatch(/queue/iu);
    // Both probes are read-only: neither may send or mutate.
    expect(workflow).not.toMatch(/send_email|sendEmail|mailbox/iu);
  });

  it('retains only the bounded redacted diagnostic artifact', () => {
    expect(workflow).toContain(
      'AC209_DIAGNOSTIC_OUTPUT_PATH: ac209-diagnostic/email.json',
    );
    expect(workflow).toContain(
      'AC209_SENDING_GROUPS_OUTPUT_PATH: ac209-sending-groups/groups.json',
    );
    expect(workflow).toContain(
      "EXPECTED_ALERT_SUBJECT: '[WeJammin] dlq_nonempty'",
    );
    const upload = workflow.match(
      /- name: Upload redacted AC209 email diagnostic[\s\S]*$/u,
    )?.[0];
    expect(upload).toBeDefined();
    expect(upload).toContain('if: always()');
    expect(upload).toMatch(/uses: actions\/upload-artifact@[0-9a-f]{40}/u);
    expect(upload).toContain('ac209-diagnostic/email.json');
    expect(upload).toContain('ac209-sending-groups/groups.json');
    expect(upload).toContain('if-no-files-found: warn');
    expect(upload).toContain('retention-days: 7');
    expect(upload).not.toMatch(/path:\s+ac209-diagnostic\s*$/mu);
  });
});
