import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '../..');
const read = (relativePath: string): string =>
  readFileSync(resolve(ROOT, relativePath), 'utf8');

type EvidenceStatus = 'verified' | 'partial' | 'unverified';

export type S09EvidenceEntry = Readonly<{
  criterion: `P2-S09-AC-${string}`;
  source: string;
  command: string;
  testFiles: readonly string[];
  testMarkers: readonly string[];
  status: EvidenceStatus;
  observed: string;
  limitation: string;
}>;

/**
 * Executable evidence index for the independent S09 remediation pass. Each
 * row names the command a reviewer can run, the concrete test files/titles it
 * executes, and the boundary that keeps the result from being over-claimed.
 */
export const S09_EVIDENCE_MAP: readonly S09EvidenceEntry[] = [
  {
    criterion: 'P2-S09-AC-209',
    source: '.memory/pipeline/progress/slices/phase-02-slice-09.md',
    command:
      'pnpm exec vitest run tests/observability/phase-02-slice-09-alert-policy.test.ts tests/observability/phase-02-slice-09-alert-boundary.test.ts',
    testFiles: [
      'tests/observability/phase-02-slice-09-alert-policy.test.ts',
      'tests/observability/phase-02-slice-09-alert-boundary.test.ts',
    ],
    testMarkers: ['[P2-S09-AC-209]'],
    status: 'partial',
    observed: 'Threshold and provider-free boundary tests pass.',
    limitation:
      'No configured provider API/dashboard query or live delivery boundary; production alert delivery remains unverified.',
  },
  {
    criterion: 'P2-S09-AC-211',
    source: '.memory/pipeline/progress/slices/phase-02-slice-09.md',
    command:
      'pnpm exec vitest run tests/performance/phase-02-slice-09-slo-measurement.test.ts',
    testFiles: ['tests/performance/phase-02-slice-09-slo-measurement.test.ts'],
    testMarkers: ['[P2-S09-AC-211]'],
    status: 'partial',
    observed:
      'All declared local latency and DLQ ratio threshold samples pass.',
    limitation:
      'Samples are deterministic local measurements; production SLO attainment and daily DLQ query remain unverified.',
  },
  {
    criterion: 'P2-S09-AC-216',
    source: '.memory/pipeline/progress/slices/phase-02-slice-09.md',
    command:
      'pnpm exec vitest run tests/security/phase-02-slice-09-input-fuzz.test.ts',
    testFiles: ['tests/security/phase-02-slice-09-input-fuzz.test.ts'],
    testMarkers: ['[P2-S09-AC-216]'],
    status: 'verified',
    observed: 'Generated hostile-input boundary tests pass.',
    limitation: 'No known limitation for the executed local fuzz corpus.',
  },
  {
    criterion: 'P2-S09-AC-217',
    source: '.memory/wiki/specs/audits/phase-02-slice-09-qa-green.md',
    command:
      'pnpm exec vitest run tests/performance/phase-02-slice-09-recovery.test.ts tests/performance/phase-02-slice-09-recovery-durable.test.ts',
    testFiles: [
      'tests/performance/phase-02-slice-09-recovery.test.ts',
      'tests/performance/phase-02-slice-09-recovery-durable.test.ts',
    ],
    testMarkers: ['[P2-S09-AC-217]'],
    status: 'verified',
    observed:
      '128-field p95, live pgTAP recovery, independent sessions, old-active rollback, DLQ replay, and no-duplicate-switch tests pass.',
    limitation:
      'Stateful Supabase and independent-session commands are recorded in QA-GREEN and intentionally remain outside nested Vitest execution.',
  },
  {
    criterion: 'P2-S09-AC-262',
    source: '.memory/wiki/specs/audits/phase-02-slice-09-qa-green.md',
    command:
      'pnpm exec playwright test --config=playwright.s09-real.config.ts tests/e2e/phase-02-slice-09-content-schema-registry-real-route.spec.ts',
    testFiles: [
      'tests/e2e/phase-02-slice-09-content-schema-registry-real-route.spec.ts',
    ],
    testMarkers: ['[P2-S09-AC-262]'],
    status: 'verified',
    observed:
      'Chromium measures the production-built route with 100 records and passes real LCP, INP, CLS, and long-task budgets.',
    limitation:
      'This is verified local production-build evidence; deployed RUM and hosted Lighthouse evidence remain unavailable.',
  },
  {
    criterion: 'P2-S09-AC-263',
    source: '.memory/pipeline/progress/slices/phase-02-slice-09.md',
    command:
      'pnpm exec vitest run tests/integration/phase-02-slice-09-dom-interactions.test.ts',
    testFiles: ['tests/integration/phase-02-slice-09-dom-interactions.test.ts'],
    testMarkers: ['[P2-S09-AC-263]'],
    status: 'verified',
    observed:
      'Real jsdom DOM submit/refetch interactions pass loading, rollback, retained-value, live-region, and focus assertions.',
    limitation:
      'No known limitation for the executed DOM interaction contract.',
  },
  {
    criterion: 'P2-S09-AC-264',
    source: '.memory/pipeline/progress/slices/phase-02-slice-09.md',
    command:
      'pnpm exec vitest run tests/integration/phase-02-slice-09-operation-boundaries.test.ts tests/integration/phase-02-slice-09-list-query-options.test.ts',
    testFiles: [
      'tests/integration/phase-02-slice-09-operation-boundaries.test.ts',
      'tests/integration/phase-02-slice-09-list-query-options.test.ts',
    ],
    testMarkers: ['[P2-S09-AC-264]'],
    status: 'verified',
    observed:
      'All eight request/success field maps, exact error maps, and A05-A08 signed/read boundaries pass.',
    limitation:
      'No known limitation for the executed contract boundary matrix.',
  },
  {
    criterion: 'P2-S09-AC-265',
    source: '.memory/wiki/specs/audits/phase-02-slice-09-qa-green.md',
    command:
      'pnpm exec playwright test tests/e2e/phase-02-slice-09-content-schema-registry-roles.spec.ts tests/e2e/phase-02-slice-09-network-resilience.spec.ts --project=chromium && pnpm exec playwright test --config=playwright.s09-real.config.ts tests/e2e/phase-02-slice-09-content-schema-registry-real-route.spec.ts',
    testFiles: [
      'tests/e2e/phase-02-slice-09-content-schema-registry-roles.spec.ts',
      'tests/e2e/phase-02-slice-09-network-resilience.spec.ts',
      'tests/e2e/phase-02-slice-09-content-schema-registry-real-route.spec.ts',
    ],
    testMarkers: ['[P2-S09-AC-265]'],
    status: 'partial',
    observed:
      'Role/resilience fixtures and the production-built server-authorized list, detail, sign-in, forged, expired, and revoked-session flows pass.',
    limitation:
      'The local route uses the isolated signed-session harness; deployed Supabase Auth, RLS, and IdP E2E remains unverified.',
  },
  {
    criterion: 'P2-S09-AC-266',
    source: '.memory/pipeline/progress/slices/phase-02-slice-09.md',
    command:
      'pnpm exec playwright test tests/e2e/phase-02-slice-09-content-schema-registry.spec.ts tests/e2e/phase-02-slice-09-accessibility-keyboard.spec.ts --project=chromium',
    testFiles: [
      'tests/e2e/phase-02-slice-09-content-schema-registry.spec.ts',
      'tests/e2e/phase-02-slice-09-accessibility-keyboard.spec.ts',
    ],
    testMarkers: ['axe', 'keyboard', 'live'],
    status: 'partial',
    observed:
      'Automated axe serious/critical, semantic, keyboard, live-region, focus, target-size, and no-trap checks pass.',
    limitation:
      'VoiceOver and NVDA are unavailable on this Linux host; no manual screen-reader execution is claimed.',
  },
  {
    criterion: 'P2-S09-AC-269',
    source: '.memory/pipeline/progress/slices/phase-02-slice-09.md',
    command:
      'pnpm exec vitest run tests/contracts/phase-02-slice-09-locked-traceability.test.ts',
    testFiles: [
      'tests/contracts/phase-02-slice-09-evidence-map.test.ts',
      'tests/contracts/phase-02-slice-09-locked-traceability.test.ts',
    ],
    testMarkers: ['[P2-S09-AC-269]'],
    status: 'verified',
    observed:
      'The executable map runs every declared safe command and validates each criterion row, concrete test file, and test marker against the current phase plan.',
    limitation:
      'Source-layer ownership remains additionally checked by the locked traceability suite; parent reconciliation still owns the final tracker state.',
  },
  {
    criterion: 'P2-S09-AC-270',
    source: '.memory/wiki/specs/audits/phase-02-slice-09-qa-green.md',
    command:
      'pnpm exec vitest run tests/contracts/phase-02-slice-09-locked-traceability.test.ts tests/performance/phase-02-slice-09-recovery.test.ts tests/performance/phase-02-slice-09-recovery-durable.test.ts',
    testFiles: [
      'tests/contracts/phase-02-slice-09-evidence-map.test.ts',
      'tests/performance/phase-02-slice-09-recovery.test.ts',
      'tests/performance/phase-02-slice-09-recovery-durable.test.ts',
    ],
    testMarkers: ['P2-S09'],
    status: 'verified',
    observed:
      'Contract, retained QA-RED, implementation, refactor, focused GREEN, and the uninterrupted canonical validation are recorded.',
    limitation:
      'External release checks remain separately classified and do not erase the completed local TDD sequence.',
  },
  {
    criterion: 'P2-S09-AC-271',
    source: '.memory/wiki/specs/audits/phase-02-slice-09-qa-green.md',
    command:
      'pnpm exec prettier --check tests/contracts/phase-02-slice-09-evidence-map.test.ts && pnpm progress:check && git diff --check',
    testFiles: ['tests/contracts/phase-02-slice-09-evidence-map.test.ts'],
    testMarkers: ['[P2-S09-AC-271]'],
    status: 'verified',
    observed:
      'Full formatting, canonical validation, progress consistency, diff, contiguous-ID, count, and mirror checks pass.',
    limitation:
      'No known limitation for the executed local reconciliation checks.',
  },
] as const;

type SpawnResult = Readonly<{
  status: number | null;
  error?: unknown;
  signal?: string | null;
  stdout?: string | Buffer;
  stderr?: string | Buffer;
}>;

type CommandRunner = (file: string, args: string[]) => SpawnResult;
type EvidenceCommandOptions = Readonly<{ allowPlaywright?: boolean }>;

const runSpawnedCommand: CommandRunner = (file, args) =>
  spawnSync(file, args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: 'pipe',
    timeout: 120_000,
    // Playwright's config derives its web port from GITHUB_RUN_ID. Isolate
    // manifest browser runs from a developer's already-running dev server;
    // the command and arguments remain exactly those declared by the map.
    env:
      args[0] === 'exec' && args[1] === 'playwright'
        ? {
            ...Object.fromEntries(
              Object.entries(process.env).filter(
                ([key]) =>
                  !['VITEST', 'VITEST_POOL_ID', 'VITEST_WORKER_ID'].includes(
                    key,
                  ),
              ),
            ),
            GITHUB_RUN_ID: String(900_000 + (process.pid % 9_000)),
          }
        : process.env,
  });

/**
 * Execute only the repository's declared evidence command shapes. Splitting
 * `&&` ourselves avoids a shell, and the allowlist prevents a manifest edit
 * from gaining arbitrary command execution. Every executed segment must exit
 * zero. Playwright is opt-in because launching a second browser/server graph
 * from inside Vitest can load a second React module instance and report a
 * misleading invalid-hook failure; direct `pnpm test:e2e` remains the browser
 * evidence gate.
 */
export const executeAllowedS09EvidenceCommand = (
  command: string,
  runner: CommandRunner = runSpawnedCommand,
  options: EvidenceCommandOptions = {},
): void => {
  if (!command.trim() || /[;|`$<>\n\r]/u.test(command))
    throw new Error('Evidence command contains a forbidden shell operator');
  for (const segment of command.split(/\s+&&\s+/u)) {
    const args = segment.trim().split(/\s+/u);
    const [file, subcommand, executable, action] = args;
    const validPnpmCommand =
      (executable === 'vitest' && action === 'run') ||
      (executable === 'playwright' && action === 'test') ||
      (executable === 'prettier' && action === '--check');
    if (file === 'git') {
      if (args.join(' ') !== 'git diff --check')
        throw new Error(`Evidence git command is not allowlisted: ${segment}`);
    } else if (
      file !== 'pnpm' ||
      (subcommand === 'progress:check' && args.length !== 2) ||
      (subcommand === 'exec' && !validPnpmCommand) ||
      (subcommand !== 'progress:check' && subcommand !== 'exec')
    ) {
      throw new Error(`Evidence command is not allowlisted: ${segment}`);
    }
    if (
      subcommand === 'exec' &&
      executable === 'playwright' &&
      options.allowPlaywright !== true
    )
      continue;
    const result = runner(file, args.slice(1));
    if (result.error !== undefined || result.status !== 0)
      throw new Error(
        `Evidence command failed: ${segment} (status=${String(result.status)}, signal=${String(result.signal)}, stderr=${String(result.stderr ?? '').slice(-600)})`,
      );
  }
};

const expectedCriteria = [
  'P2-S09-AC-209',
  'P2-S09-AC-211',
  'P2-S09-AC-216',
  'P2-S09-AC-217',
  'P2-S09-AC-262',
  'P2-S09-AC-263',
  'P2-S09-AC-264',
  'P2-S09-AC-265',
  'P2-S09-AC-266',
  'P2-S09-AC-269',
  'P2-S09-AC-270',
  'P2-S09-AC-271',
] as const;

describe('[P2-S09-AC-269] executable S09 evidence map', () => {
  it('covers each requested criterion with runnable evidence and explicit limits', () => {
    expect(S09_EVIDENCE_MAP.map(({ criterion }) => criterion)).toEqual(
      expectedCriteria,
    );
    expect(
      new Set(S09_EVIDENCE_MAP.map(({ criterion }) => criterion)).size,
    ).toBe(expectedCriteria.length);

    for (const entry of S09_EVIDENCE_MAP) {
      const source = read(entry.source);
      expect(source, `${entry.criterion} source row`).toContain(
        entry.criterion,
      );
      expect(entry.command, `${entry.criterion} command`).toMatch(/^pnpm /u);
      expect(entry.observed, `${entry.criterion} observed result`).toMatch(
        /\S/u,
      );
      expect(entry.limitation, `${entry.criterion} limitation`).toMatch(/\S/u);
      expect(['verified', 'partial', 'unverified']).toContain(entry.status);

      for (const testFile of entry.testFiles) {
        expect(existsSync(resolve(ROOT, testFile)), testFile).toBe(true);
        const testSource = read(testFile);
        expect(
          entry.testMarkers.some((marker) => testSource.includes(marker)),
          `${entry.criterion} marker in ${testFile}`,
        ).toBe(true);
      }
    }
  });

  it(
    '[P2-S09-AC-269] validates every declared command, executes local evidence, and rejects nonzero runners',
    { timeout: 180_000 },
    () => {
      for (const entry of S09_EVIDENCE_MAP)
        executeAllowedS09EvidenceCommand(entry.command);

      expect(() =>
        executeAllowedS09EvidenceCommand('pnpm progress:check', () => ({
          status: 1,
          signal: null,
        })),
      ).toThrow(/Evidence command failed/iu);
      expect(() =>
        executeAllowedS09EvidenceCommand(
          'pnpm exec playwright test tests/e2e/phase-02-slice-09-content-schema-registry-performance.spec.ts --project=chromium',
          () => ({ status: 1, signal: null }),
          { allowPlaywright: true },
        ),
      ).toThrow(/Evidence command failed/iu);
    },
  );

  it('[P2-S09-AC-271] keeps the operation-boundary artifact within both line-count conventions', () => {
    const operationBoundary = read(
      'tests/integration/phase-02-slice-09-operation-boundaries.test.ts',
    );
    const splitCount = operationBoundary.split(String.fromCharCode(10)).length;
    // `wc -l` counts newline characters; this is its exact equivalent here.
    const wcEquivalent = operationBoundary.endsWith(String.fromCharCode(10))
      ? splitCount - 1
      : splitCount;
    expect(wcEquivalent).toBeLessThanOrEqual(400);
    expect(splitCount).toBeLessThanOrEqual(400);
  });

  it('keeps the independent QA-RED record and blocks a premature QA-GREEN claim', () => {
    const audit = read(
      '.memory/wiki/specs/audits/phase-02-slice-09-verification-remediation.md',
    );
    expect(audit).toMatch(/283 criteria/iu);
    expect(audit).toMatch(/252[\s\S]{0,40}19[\s\S]{0,40}12/iu);
    expect(audit).toContain('133,098');
    expect(audit).toContain('92,160');
    expect(audit).toContain('Canonical QA-GREEN');
    expect(audit).toMatch(/pending parent\s+validation/iu);
    expect(audit).toMatch(/VoiceOver and NVDA/iu);
    expect(audit).toMatch(/provider-delivery unverified/iu);
  });
});
