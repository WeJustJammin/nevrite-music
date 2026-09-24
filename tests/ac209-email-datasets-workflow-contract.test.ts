import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/probe-production-ac209-email-datasets.yml',
    import.meta.url,
  ),
  'utf8',
);

const header = workflow.slice(0, workflow.indexOf('\njobs:'));
const probe = workflow.match(/\n\s{2}probe:\n[\s\S]*$/u)?.[0] ?? '';

const lineIndent = (line: string): number =>
  line.length - line.trimStart().length;

const jobBodyOf = (source: string, job: string): string => {
  const lines = source.split('\n');
  const start = lines.findIndex((line) => line.trim() === `${job}:`);
  if (start < 0) return '';
  const body = [lines[start]];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() !== '' && lineIndent(line) <= 2 && !line.startsWith(' '))
      break;
    if (/^ {2}\S/u.test(line)) break;
    body.push(line);
  }
  return body.join('\n');
};

const linesWithIndent = (
  source: string,
  key: string,
  indent: number,
): readonly string[] =>
  source.split('\n').filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith(`${key}:`) &&
      lineIndent(line) === indent &&
      line.length > 0
    );
  });

/**
 * The datasets probe is a second read-only sibling, so it inherits every
 * dispatch guard the sending probe already carries. These assertions are
 * structural (indentation-scoped) for the same reason: a credential hoisted
 * from a step to its job would pass a bare `toContain`.
 */
describe('production AC209 email datasets probe workflow contract', () => {
  it('is an explicit confirmed main-only manual probe', () => {
    expect(header).toContain('workflow_dispatch:');
    expect(header).not.toMatch(
      /\n\s+(schedule|push|pull_request|workflow_run|release):/u,
    );
    expect(header).toMatch(
      /source_revision:\n\s+description:[\s\S]*?required: true\n\s+type: string/u,
    );
    expect(header).toMatch(
      /confirm_presence_probe:\n\s+description:[\s\S]*?required: true\n\s+type: boolean\n\s+default: false/u,
    );
    expect(workflow).toMatch(
      /if: inputs\.confirm_presence_probe == true && github\.ref == 'refs\/heads\/main'/u,
    );
    expect(workflow).toContain(
      'concurrency:\n  group: probe-production-ac209-email-datasets\n  cancel-in-progress: false',
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
    expect(
      workflow.indexOf('Set up pinned workspace dependencies'),
    ).toBeLessThan(
      workflow.indexOf('Reverify immutable workspace before secret use'),
    );
    expect(
      workflow.indexOf('Reverify immutable workspace before secret use'),
    ).toBeLessThan(workflow.indexOf('CLOUDFLARE_OBSERVABILITY_API_TOKEN:'));
  });

  it('uses only the protected production environment and its read-only credentials', () => {
    expect(workflow).toContain('environment: { name: production }');
    expect(workflow).toContain('runs-on: [self-hosted, wejammin]');
    expect(workflow).toMatch(/\n\s{2}probe:\n\s+needs: preflight/u);
    expect(probe).toContain(
      "CLOUDFLARE_EMAIL_ZONE_ID: '${{ vars.CLOUDFLARE_EMAIL_ZONE_ID }}'",
    );
    expect(probe).toContain(
      "CLOUDFLARE_OBSERVABILITY_API_TOKEN: '${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}'",
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

  it('keeps both protected credentials at step level and out of job env', () => {
    const credentials = [
      'CLOUDFLARE_EMAIL_ZONE_ID',
      'CLOUDFLARE_OBSERVABILITY_API_TOKEN',
    ] as const;

    for (const job of ['preflight', 'probe'] as const) {
      const jobBody = jobBodyOf(workflow, job);
      expect(jobBody).not.toBe('');
      const hoisted = jobBody
        .split('\n')
        .slice(1)
        .filter(
          (line) =>
            lineIndent(line) === 6 &&
            credentials.some((name) => line.trim().startsWith(`${name}:`)),
        );
      expect(hoisted).toEqual([]);
    }

    for (const name of credentials) {
      expect(linesWithIndent(workflow, name, 10)).toHaveLength(1);
      expect(workflow.split(`${name}:`)).toHaveLength(2);
    }
  });

  it('runs only the bounded read-only datasets entrypoint', () => {
    expect(workflow).toContain(
      'run: node --experimental-strip-types infra/workflows/probe-production-ac209-datasets.ts',
    );
    expect(workflow).not.toMatch(/exercise-production-ac209/u);
    expect(workflow).not.toMatch(/cleanup-production-ac209/u);
    expect(workflow).not.toMatch(/wrangler deploy/u);
    expect(workflow).not.toMatch(/apply-hosted-migrations/u);
    expect(workflow).not.toMatch(/deploy-api-worker/u);
    expect(workflow).not.toMatch(/gh workflow run/u);
    expect(workflow).not.toMatch(/queue/iu);
  });

  it('retains only the bounded redacted datasets artifact', () => {
    expect(workflow).toContain(
      'AC209_DATASETS_OUTPUT_PATH: ac209-datasets/datasets.json',
    );
    const upload = workflow.match(
      /- name: Upload redacted AC209 email datasets probe[\s\S]*$/u,
    )?.[0];
    expect(upload).toBeDefined();
    expect(upload).toContain('if: always()');
    expect(upload).toMatch(/uses: actions\/upload-artifact@[0-9a-f]{40}/u);
    expect(upload).toContain('path: ac209-datasets/datasets.json');
    expect(upload).toContain('if-no-files-found: warn');
    expect(upload).toContain('retention-days: 7');
  });

  it('never claims AC209 acceptance from a presence probe', () => {
    for (const source of [workflow, header, probe]) {
      expect(source).not.toMatch(/acceptance/u);
      expect(source).not.toMatch(
        /(?:marks?|closes?)\s+(?:AC209|the criterion)/iu,
      );
      expect(source).not.toMatch(/verified|waived|simulated/iu);
    }
  });
});
