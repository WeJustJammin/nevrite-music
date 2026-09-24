import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/probe-production-ac209-email-presence.yml',
    import.meta.url,
  ),
  'utf8',
);

const header = workflow.slice(0, workflow.indexOf('\njobs:'));
const probe = workflow.match(/\n\s{2}probe:\n[\s\S]*$/u)?.[0] ?? '';

/**
 * Indentation-based structural check: YAML indentation IS the structure, so a
 * fixed column proves which node owns a mapping key. A bare `toContain` cannot
 * see a hoist from a step to its parent job, which is exactly the regression
 * this guards: a job-level `env:` would hand the credential to every step.
 */
const lineIndent = (line: string): number =>
  line.length - line.trimStart().length;

/** Returns the lines that declare `key:` at exactly the requested indentation. */
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

/** Indentation of a named job's own `env:` block, or undefined when absent. */
const jobEnvIndent = (source: string, job: string): number | undefined => {
  const jobBody = jobBodyOf(source, job);
  const line = jobBody
    .split('\n')
    .find((entry) => entry.trim().startsWith('env:'));
  return line === undefined ? undefined : lineIndent(line);
};

/**
 * Returns the direct children of the `key:` mapping declared inside `job` at
 * `keyIndent`, stopping at the first line indented no deeper than the key. This
 * scopes an assertion to one mapping so sibling blocks at the same depth (step
 * names, other job keys) cannot satisfy or defeat it.
 */
const mappingChildrenOf = (
  source: string,
  job: string,
  key: string,
  keyIndent: number,
): readonly string[] => {
  const lines = jobBodyOf(source, job).split('\n');
  const start = lines.findIndex(
    (line) => lineIndent(line) === keyIndent && line.trim() === `${key}:`,
  );
  if (start < 0) return [];
  const children: string[] = [];
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === '') continue;
    if (lineIndent(line) <= keyIndent) break;
    children.push(line.trim());
  }
  return children;
};

/**
 * Splits one top-level job out of the `jobs:` mapping. Jobs sit at two spaces;
 * their contents are deeper, so the job ends at the next two-space key.
 */
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

describe('production AC209 email presence probe workflow contract', () => {
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
      'concurrency:\n  group: probe-production-ac209-email-presence\n  cancel-in-progress: false',
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

    // The probe job's own `env:` must exist (it carries the output path) and
    // must not be where the credential is declared.
    expect(jobEnvIndent(workflow, 'probe')).toBe(4);

    for (const job of ['preflight', 'probe'] as const) {
      const jobBody = jobBodyOf(workflow, job);
      expect(jobBody).not.toBe('');
      // A hoisted credential would be a child of the job's own `env:` block at
      // six spaces, handing it to every step in that job.
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

    // The probe job's env block carries only the non-secret output path, so a
    // credential hoist would change this list and fail the assertion above.
    expect(mappingChildrenOf(workflow, 'probe', 'env', 4)).toEqual([
      'AC209_PRESENCE_OUTPUT_PATH: ac209-presence/presence.json',
    ]);

    // Each credential must appear exactly once in the whole workflow, at the
    // step-scoped indentation (ten spaces) inside the collecting step.
    for (const name of credentials) {
      expect(linesWithIndent(workflow, name, 10)).toHaveLength(1);
      expect(workflow.split(`${name}:`)).toHaveLength(2);
    }

    // Find the step that owns the credential mapping and prove that step is the
    // collection step, inside the probe job's `steps:` list. Scoping to the
    // owning step keeps the check precise: other steps legitimately declare
    // their own `env:` blocks, so a global count would be meaningless.
    const probeLines = jobBodyOf(workflow, 'probe').split('\n');
    const owningStep = probeLines.findIndex((line) =>
      line.trim().startsWith('CLOUDFLARE_OBSERVABILITY_API_TOKEN:'),
    );
    expect(owningStep).toBeGreaterThan(0);
    const stepName = probeLines
      .slice(0, owningStep)
      .reverse()
      .find((line) => line.trimStart().startsWith('- name:'));
    expect(stepName?.trim()).toBe(
      '- name: Collect redacted AC209 email presence probe',
    );
    expect(probeLines[owningStep]).toBe(
      "          CLOUDFLARE_OBSERVABILITY_API_TOKEN: '${{ secrets.CLOUDFLARE_OBSERVABILITY_API_TOKEN }}'",
    );
    // The credential keys must be direct children of that step's `env:` block,
    // never of the job: walk back to the nearest `env:` at step-child indent.
    const envIndent = 8;
    const owningEnv = probeLines
      .slice(0, owningStep)
      .reverse()
      .find((line) => lineIndent(line) === envIndent && line.trim() === 'env:');
    expect(owningEnv).toBe('        env:');
    // Every credential line is a child of that block, not a sibling job key.
    for (const name of credentials)
      expect(
        linesWithIndent(jobBodyOf(workflow, 'probe'), name, 10),
      ).toHaveLength(1);
  });

  it('runs only the bounded read-only presence entrypoint', () => {
    expect(workflow).toContain(
      'run: node --experimental-strip-types infra/workflows/probe-production-ac209-email-presence.ts',
    );
    expect(workflow).not.toMatch(/exercise-production-ac209/u);
    expect(workflow).not.toMatch(/cleanup-production-ac209/u);
    expect(workflow).not.toMatch(/diagnose-production-ac209-email\.ts/u);
    expect(workflow).not.toMatch(/wrangler deploy/u);
    expect(workflow).not.toMatch(/apply-hosted-migrations/u);
    expect(workflow).not.toMatch(/deploy-api-worker/u);
    expect(workflow).not.toMatch(/gh workflow run/u);
    expect(workflow).not.toMatch(/queue/iu);
  });

  it('retains only the bounded redacted presence artifact', () => {
    expect(workflow).toContain(
      'AC209_PRESENCE_OUTPUT_PATH: ac209-presence/presence.json',
    );
    const upload = workflow.match(
      /- name: Upload redacted AC209 email presence probe[\s\S]*$/u,
    )?.[0];
    expect(upload).toBeDefined();
    expect(upload).toContain('if: always()');
    expect(upload).toMatch(/uses: actions\/upload-artifact@[0-9a-f]{40}/u);
    expect(upload).toContain('path: ac209-presence/presence.json');
    expect(upload).toContain('if-no-files-found: warn');
    expect(upload).toContain('retention-days: 7');
    expect(upload).not.toMatch(/path:\s+ac209-presence\s*$/mu);
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
