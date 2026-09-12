import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflowPath = new URL(
  '../.github/workflows/exercise-production-ac209.yml',
  import.meta.url,
);

const readWorkflow = (): string => readFileSync(workflowPath, 'utf8');

const exerciseEntrypointUrl = new URL(
  '../infra/workflows/exercise-production-ac209.ts',
  import.meta.url,
);

describe('production AC209 exercise workflow contract', () => {
  it('loads its full import graph under the strip-only Node runtime used in production', () => {
    const probe = spawnSync(
      process.execPath,
      [
        '--experimental-strip-types',
        '--input-type=module',
        '--eval',
        `await import(${JSON.stringify(exerciseEntrypointUrl.href)}); process.stdout.write('AC209_STRIP_IMPORT_OK\\n');`,
      ],
      { encoding: 'utf8' },
    );

    expect({
      status: probe.status,
      signal: probe.signal,
      stdout: probe.stdout,
    }).toEqual({
      status: 0,
      signal: null,
      stdout: 'AC209_STRIP_IMPORT_OK\n',
    });
    expect(probe.stderr).not.toContain('ERR_UNSUPPORTED_TYPESCRIPT_SYNTAX');
  });

  it('is an explicit serialized main-only production operation', () => {
    const workflow = readWorkflow();
    const header = workflow.slice(0, workflow.indexOf('\njobs:'));
    expect(header).toContain('workflow_dispatch:');
    expect(header).not.toMatch(/\b(schedule|push|pull_request|workflow_run):/u);
    for (const input of [
      'source_revision',
      'production_version_id',
      'expected_dlq_id',
      'configuration_id',
      'configuration_reference',
    ])
      expect(header).toMatch(
        new RegExp(
          `${input}:\\n\\s+description:[\\s\\S]*?required: true\\n\\s+type: string`,
          'u',
        ),
      );
    expect(header).toMatch(
      /confirm_exercise:\n\s+description:[\s\S]*?required: true\n\s+type: boolean\n\s+default: false/u,
    );
    expect(workflow).toContain(
      'concurrency: { group: exercise-production-ac209, cancel-in-progress: false }',
    );
    expect(workflow).toContain('permissions: { contents: read }');
    expect(workflow).toMatch(
      /if: inputs\.confirm_exercise == true && github\.ref == 'refs\/heads\/main'/u,
    );
    expect(workflow).toContain('environment:\n      name: production');
  });

  it('checks out and verifies the exact requested source before provider access', () => {
    const workflow = readWorkflow();
    expect(workflow).toMatch(/actions\/checkout@[0-9a-f]{40}/u);
    expect(workflow).toContain('ref: ${{ inputs.source_revision }}');
    expect(workflow).toContain('persist-credentials: false');
    expect(workflow).toContain('EXPECTED_DISPATCH_SHA: ${{ github.sha }}');
    expect(workflow).toContain('uses: ./.github/actions/setup');
    expect(workflow).toContain('checked_out_sha="$(git rev-parse HEAD)"');
    expect(workflow).toContain('test "$GITHUB_REF" = "refs/heads/main"');
    expect(workflow).toContain(
      'test "$SOURCE_REVISION" = "$EXPECTED_DISPATCH_SHA"',
    );
    expect(workflow).toContain(
      'test "$checked_out_sha" = "$EXPECTED_SOURCE_REVISION"',
    );
    expect(
      workflow.indexOf('Verify protected execution identity'),
    ).toBeLessThan(workflow.indexOf('Set up workspace'));
    expect(workflow.indexOf('Set up workspace')).toBeLessThan(
      workflow.indexOf('Reverify immutable workspace before secrets'),
    );
    expect(workflow).toContain('git diff --quiet');
    expect(workflow).toContain('git diff --cached --quiet');
    expect(workflow).toContain(
      'test -z "$(git status --porcelain --untracked-files=all)"',
    );
    expect(
      workflow.indexOf('Reverify immutable workspace before secrets'),
    ).toBeLessThan(
      workflow.indexOf('Collect exact-version AC209 configuration'),
    );
  });

  it('revalidates exact-version configuration before the mutating exercise', () => {
    const workflow = readWorkflow();
    const collector = workflow.match(
      /- name: Collect exact-version AC209 configuration[\s\S]*?(?=\n\s{6}- name: Exercise)/u,
    )?.[0];
    expect(collector).toBeDefined();
    expect(collector).toContain('id: configuration_collector');
    expect(workflow).toContain(
      'node --experimental-strip-types infra/workflows/collect-content-schema-registry-alert-configuration.ts',
    );
    expect(workflow).toContain(
      'PRODUCTION_VERSION_ID: ${{ inputs.production_version_id }}',
    );
    expect(workflow).toContain(
      'EXPECTED_DLQ_ID: ${{ inputs.expected_dlq_id }}',
    );
    expect(workflow).toContain(
      'CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
    );
    expect(workflow).toContain(
      'CLOUDFLARE_OBSERVABILITY_API_TOKEN: ${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}',
    );
    expect(
      workflow.indexOf('Collect exact-version AC209 configuration'),
    ).toBeLessThan(workflow.indexOf('Exercise one production queue message'));
  });

  it('uses protected least-privilege exercise credentials and pinned metadata', () => {
    const workflow = readWorkflow();
    const exercise = workflow.slice(
      workflow.indexOf('- name: Exercise one production queue message'),
    );
    for (const expected of [
      'CLOUDFLARE_QUEUE_EXERCISE_TOKEN: ${{ secrets.CLOUDFLARE_QUEUE_EXERCISE_TOKEN }}',
      'CLOUDFLARE_EMAIL_ANALYTICS_API_TOKEN: ${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}',
      'CLOUDFLARE_PLATFORM_QUEUE_ID: ${{ vars.CLOUDFLARE_PLATFORM_QUEUE_ID }}',
      'CLOUDFLARE_EMAIL_ZONE_ID: ${{ vars.CLOUDFLARE_EMAIL_ZONE_ID }}',
      'EXPECTED_ALERT_SENDER_SHA256: ${{ vars.PRODUCTION_ALERT_SENDER_SHA256 }}',
      'EXPECTED_ALERT_EMAIL_SHA256: ${{ vars.PRODUCTION_ALERT_EMAIL_SHA256 }}',
      'SUPABASE_URL: ${{ vars.SUPABASE_URL }}',
      'SUPABASE_SECRET_KEY: ${{ secrets.SUPABASE_SECRET_KEY }}',
    ])
      expect(exercise).toContain(expected);
    expect(exercise).not.toContain(
      'CLOUDFLARE_QUEUE_EXERCISE_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
    );
    expect(exercise).not.toContain(
      'CLOUDFLARE_EMAIL_ANALYTICS_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}',
    );
  });

  it('runs the bounded exact-cleanup orchestrator and uploads only redacted artifacts', () => {
    const workflow = readWorkflow();
    expect(workflow).toContain('timeout-minutes: 75');
    expect(workflow).toContain(
      'AC209_EXERCISE_OUTPUT_PATH: ac209-exercise/exercise.json',
    );
    expect(workflow).toContain(
      'node --experimental-strip-types infra/workflows/exercise-production-ac209.ts',
    );
    expect(workflow).toContain('- name: Prepare opaque exercise marker');
    expect(workflow).toContain(
      'AC209_MARKER_REPOSITORY_ID: ${{ github.repository_id }}',
    );
    expect(workflow).toContain('AC209_MARKER_RUN_ID: ${{ github.run_id }}');
    expect(workflow).toContain(
      'node --experimental-strip-types infra/workflows/ac209-exercise-marker.ts',
    );
    expect(workflow).not.toContain('randomUUID');
    expect(workflow).toContain(
      'echo "AC209_EXERCISE_MARKER=$marker" >> "$GITHUB_ENV"',
    );
    const cleanup = workflow.match(
      /- name: Ensure exact AC209 marker cleanup[\s\S]*?(?=\n\s{6}- name: Upload)/u,
    )?.[0];
    expect(cleanup).toBeDefined();
    expect(cleanup).toContain(
      "if: always() && steps.configuration_collector.outcome == 'success' && steps.production_exercise.outcome != 'success'",
    );
    expect(cleanup).toContain(
      'CLOUDFLARE_QUEUE_EXERCISE_TOKEN: ${{ secrets.CLOUDFLARE_QUEUE_EXERCISE_TOKEN }}',
    );
    expect(cleanup).toContain(
      'node --experimental-strip-types infra/workflows/cleanup-production-ac209.ts',
    );
    const upload = workflow.match(
      /uses: actions\/upload-artifact@[0-9a-f]{40}[\s\S]*$/u,
    )?.[0];
    expect(upload).toBeDefined();
    expect(upload).toContain('ac209-exercise/configuration.json');
    expect(upload).toContain('ac209-exercise/exercise.json');
    expect(upload).not.toMatch(/path:\s+ac209-exercise\s*$/mu);
    expect(upload).toContain('if-no-files-found: error');
    expect(upload).toContain('retention-days: 30');
    expect(upload).not.toMatch(/if: always\(\)/u);
    expect(workflow).not.toMatch(/\b(wrangler deploy|supabase db reset)\b/iu);
  });
});
