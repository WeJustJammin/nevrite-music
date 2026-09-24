import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const workflow = readFileSync(
  new URL(
    '../.github/workflows/probe-production-ac209-routing-events.yml',
    import.meta.url,
  ),
  'utf8',
);

/** Reads one sibling source file so the text guards cover every surface. */
const readSource = (file: string): string =>
  readFileSync(new URL(`../infra/workflows/${file}`, import.meta.url), 'utf8');

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

describe('production AC209 routing event workflow contract', () => {
  it('is an explicit confirmed main-only manual probe', () => {
    expect(header).toContain('workflow_dispatch:');
    expect(header).not.toMatch(
      /\n\s+(schedule|push|pull_request|workflow_run|release):/u,
    );
    for (const input of ['source_revision', 'window_start', 'window_end'])
      expect(header).toMatch(
        new RegExp(
          `${input}:\n\\s+description:[\\s\\S]*?required: true\n\\s+type: string`,
          'u',
        ),
      );
    expect(header).toMatch(
      /confirm_routing_event_probe:\n\s+description:[\s\S]*?required: true\n\s+type: boolean\n\s+default: false/u,
    );
    expect(workflow).toMatch(
      /if: inputs\.confirm_routing_event_probe == true && github\.ref == 'refs\/heads\/main'/u,
    );
    expect(workflow).toContain(
      'concurrency:\n  group: probe-production-ac209-routing-events\n  cancel-in-progress: false',
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

  it('runs only the bounded read-only routing event entrypoint', () => {
    expect(workflow).toContain(
      'run: node --experimental-strip-types infra/workflows/probe-production-ac209-routing-events.ts',
    );
    expect(workflow).not.toMatch(/exercise-production-ac209/u);
    expect(workflow).not.toMatch(/cleanup-production-ac209/u);
    expect(workflow).not.toMatch(/wrangler deploy/u);
    expect(workflow).not.toMatch(/apply-hosted-migrations/u);
    expect(workflow).not.toMatch(/deploy-api-worker/u);
    expect(workflow).not.toMatch(/gh workflow run/u);
    expect(workflow).not.toMatch(/queue/iu);
  });

  it('retains only the bounded redacted routing event artifact for seven days', () => {
    expect(workflow).toContain(
      'AC209_ROUTING_EVENT_OUTPUT_PATH: ac209-routing-event/routing-events.json',
    );
    const upload = workflow.match(
      /- name: Upload redacted AC209 routing events[\s\S]*$/u,
    )?.[0];
    expect(upload).toBeDefined();
    expect(upload).toContain('if: always()');
    expect(upload).toMatch(/uses: actions\/upload-artifact@[0-9a-f]{40}/u);
    expect(upload).toContain('path: ac209-routing-event/routing-events.json');
    expect(upload).toContain('if-no-files-found: warn');
    expect(upload).toContain('retention-days: 7');
  });

  it('never promises an exact event count anywhere the diagnostic is defined', () => {
    // The Adaptive suffix means the dataset may be served from a sample, so no
    // surface may promise exactness. The guard covers the workflow, the contract,
    // the schema, the collector, and the entrypoint, so a recurrence in any of
    // them fails here rather than shipping. The banned forms are affirmative
    // claims only; wording that says the counts are NOT guaranteed exact is the
    // caveat itself and must stay legal.
    //
    // Absence claims are NOT matched here on purpose. The caveat that a zero-row
    // hour is not proof of absence necessarily contains the words "no routing
    // event occurred", so a prose pattern cannot separate the caveat from an
    // actual claim and would either pass everything or fail the caveat. That
    // guarantee is enforced structurally instead: the report schema pins
    // `underlyingEventAbsence` to `not_established`, and the contract-closure
    // suite proves the literal is required and that every affirmative variant is
    // rejected.
    const surfaces = [
      ['workflow', workflow],
      ['workflow header', header],
      ['workflow probe job', probe],
      ['contract', readSource('ac209-email-routing-event-contract.ts')],
      ['schema', readSource('ac209-email-routing-event-schema.ts')],
      ['collector', readSource('ac209-email-routing-event.ts')],
      ['entrypoint', readSource('probe-production-ac209-routing-events.ts')],
    ] as const;

    for (const [label, source] of surfaces) {
      for (const banned of [
        /exact[_ ]?event[_ ]?count/iu,
        /exact[_ ]?total/iu,
        // A numeric exactness claim, for example "exactly 3 routing events".
        // Naming an exact REVISION stays legal, so the pattern is about numbers.
        /exact(?:ly)? \d+/iu,
        /proves? (?:the )?(?:alert|send|delivery)/iu,
        /confirms? (?:delivery|the send)/iu,
      ])
        expect({ label, match: source.match(banned) }).toEqual({
          label,
          match: null,
        });
    }
  });

  it('never claims AC209 acceptance or transport attribution', () => {
    // The parent task's guard: a routing `dropped` row cannot show which dataset
    // should hold the transport, refute a Sending reading, or close AC209.
    for (const source of [workflow, header, probe]) {
      expect(source).not.toMatch(/acceptance/u);
      expect(source).not.toMatch(
        /(?:marks?|closes?)\s+(?:AC209|the criterion)/iu,
      );
      expect(source).not.toMatch(/verified|waived|simulated/iu);
      expect(source).not.toMatch(/should have|ought to have/iu);
    }
  });
});
