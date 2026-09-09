import { chromium } from '@playwright/test';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  assertPlaywrightChromiumExecutable,
  playwrightChromiumExecutablePath,
} from '../../infra/workflows/content-schema-registry-axe-browser.ts';
import {
  assertExpectedAxeNavigation,
  assertExpectedReleaseHeader,
  isApprovedHostedDocumentUrl,
  relativePathFromHostedUrl,
  waitForExpectedReleaseNavigation,
} from '../../infra/workflows/collect-content-schema-registry-axe-evidence.ts';
import { resolveReportRoot } from '../../infra/workflows/content-schema-registry-axe-report-files.ts';
import { summarizeAxeResult } from '../../infra/workflows/content-schema-registry-axe-report-builder.ts';
import {
  sourceRevision,
  webOrigin,
} from './phase-02-slice-09-automated-axe-report.test-support.ts';

describe('Slice 09 AC266 automated axe navigation contract', () => {
  it('summarizes only bounded rule metadata and counts serious findings', () => {
    expect(
      summarizeAxeResult({
        violations: [
          { id: 'color-contrast', impact: 'serious', nodes: [{}, {}] },
          { id: 'label', impact: 'moderate', nodes: [{}] },
          { id: 'aria-roles', impact: 'critical', nodes: [{}] },
          { id: 'unknown', impact: null, nodes: [{}] },
        ],
        incomplete: [],
        passes: [],
      }),
    ).toEqual({
      violationCount: 4,
      seriousCount: 1,
      criticalCount: 1,
      incompleteCount: 0,
      passCount: 0,
      violations: [
        { id: 'aria-roles', impact: 'critical', nodeCount: 1 },
        { id: 'color-contrast', impact: 'serious', nodeCount: 2 },
        { id: 'label', impact: 'moderate', nodeCount: 1 },
        { id: 'unknown', impact: 'unknown', nodeCount: 1 },
      ],
    });
  });

  it('keeps OAuth and cross-origin state out of retained paths', () => {
    expect(
      relativePathFromHostedUrl(
        `${webOrigin}/auth/sign-in?code=secret#callback`,
        webOrigin,
      ),
    ).toBe('/auth/sign-in');
    expect(() =>
      relativePathFromHostedUrl('https://evil.example/callback', webOrigin),
    ).toThrow('Hosted axe navigation left the approved web origin');
    expect(
      isApprovedHostedDocumentUrl(`${webOrigin}/auth/sign-in`, webOrigin),
    ).toBe(true);
    expect(
      isApprovedHostedDocumentUrl('https://evil.example/callback', webOrigin),
    ).toBe(false);
    expect(
      isApprovedHostedDocumentUrl(
        'https://user:secret@staging.wejamm.in/auth/sign-in',
        webOrigin,
      ),
    ).toBe(false);
  });

  it('derives the final path through the approved hosted-origin validator', () => {
    const collectorSource = readFileSync(
      new URL(
        '../../infra/workflows/collect-content-schema-registry-axe-evidence.ts',
        import.meta.url,
      ),
      'utf8',
    );
    expect(collectorSource).toMatch(
      /relativePathFromHostedUrl\(\s*page\.url\(\),\s*expectedOrigin,?\s*\)/u,
    );
    expect(collectorSource).not.toContain('new URL(page.url()).pathname');
    expect(collectorSource).toContain('waitForExpectedReleaseNavigation({');
  });

  it('requires the expected final path and successful status for every target', () => {
    expect(() =>
      assertExpectedAxeNavigation({
        requestedPath: '/app/cms-content-modeling',
        finalPath: '/attacker-controlled-final-path',
        httpStatus: 200,
      }),
    ).toThrow(
      'Automated axe path /app/cms-content-modeling did not end at expected /auth/sign-in (auth-boundary).',
    );
    expect(() =>
      assertExpectedAxeNavigation({
        requestedPath: '/auth/sign-in',
        finalPath: '/auth/sign-in',
        httpStatus: 404,
      }),
    ).toThrow('returned HTTP 404; expected 200');
    expect(() =>
      assertExpectedAxeNavigation({
        requestedPath: '/',
        finalPath: '/',
        httpStatus: 500,
      }),
    ).toThrow('returned HTTP 500; expected 200');
    expect(() =>
      assertExpectedAxeNavigation({
        requestedPath: '/',
        finalPath: '/',
        httpStatus: null,
      }),
    ).toThrow('returned HTTP null; expected 200');
  });

  it('requires every document response to identify the promoted source revision', () => {
    expect(() =>
      assertExpectedReleaseHeader({
        sourceRevision,
        releaseHeader: sourceRevision,
      }),
    ).not.toThrow();
    expect(() =>
      assertExpectedReleaseHeader({ sourceRevision, releaseHeader: null }),
    ).toThrow(
      'Automated axe document release header did not match SOURCE_REVISION.',
    );
    expect(() =>
      assertExpectedReleaseHeader({
        sourceRevision,
        releaseHeader: 'b'.repeat(40),
      }),
    ).toThrow(
      'Automated axe document release header did not match SOURCE_REVISION.',
    );
  });

  it('retries only release-header propagation and accepts the exact revision', async () => {
    const releases = ['b'.repeat(40), null, sourceRevision];
    const delays: number[] = [];
    let attempts = 0;

    const result = await waitForExpectedReleaseNavigation({
      attempts: 5,
      delayMs: 25,
      navigate: async () => {
        const releaseHeader = releases[attempts++] ?? null;
        assertExpectedReleaseHeader({ sourceRevision, releaseHeader });
        return { releaseHeader, finalPath: '/auth/sign-in' };
      },
      sleepImpl: async (delayMs) => {
        delays.push(delayMs);
      },
    });

    expect(result).toEqual({
      releaseHeader: sourceRevision,
      finalPath: '/auth/sign-in',
    });
    expect(attempts).toBe(3);
    expect(delays).toEqual([25, 25]);
  });

  it('uses the bounded production retry defaults', async () => {
    vi.useFakeTimers();
    let attempts = 0;
    try {
      const result = waitForExpectedReleaseNavigation({
        navigate: async () => {
          attempts += 1;
          assertExpectedReleaseHeader({
            sourceRevision,
            releaseHeader: attempts === 1 ? null : sourceRevision,
          });
          return attempts;
        },
      });

      await vi.runAllTimersAsync();
      await expect(result).resolves.toBe(2);
      expect(attempts).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('fails closed after bounded release-header retries without leaking values', async () => {
    let attempts = 0;
    const mismatch = 'b'.repeat(40);

    const failure = waitForExpectedReleaseNavigation({
      attempts: 3,
      delayMs: 0,
      navigate: async () => {
        attempts += 1;
        assertExpectedReleaseHeader({
          sourceRevision,
          releaseHeader: mismatch,
        });
        return { releaseHeader: mismatch };
      },
      sleepImpl: async () => undefined,
    });

    await expect(failure).rejects.toThrow(
      'Automated axe document release header did not match SOURCE_REVISION.',
    );
    await expect(failure).rejects.not.toThrow(mismatch);
    expect(attempts).toBe(3);
  });

  it('does not retry non-release navigation failures', async () => {
    let attempts = 0;
    let sleeps = 0;

    await expect(
      waitForExpectedReleaseNavigation({
        attempts: 5,
        delayMs: 25,
        navigate: async () => {
          attempts += 1;
          throw new Error('navigation contract failed');
        },
        sleepImpl: async () => {
          sleeps += 1;
        },
      }),
    ).rejects.toThrow('navigation contract failed');
    expect(attempts).toBe(1);
    expect(sleeps).toBe(0);
  });

  it.each([
    [{ attempts: 0 }, 'attempts must be a positive integer'],
    [{ attempts: 1.5 }, 'attempts must be a positive integer'],
    [{ attempts: 11 }, 'attempts must not exceed 10'],
    [{ delayMs: -1 }, 'retry delay must be non-negative'],
    [{ delayMs: Number.POSITIVE_INFINITY }, 'retry delay must be non-negative'],
    [{ delayMs: 30_001 }, 'retry delay must not exceed 30000 ms'],
  ])('rejects invalid release retry options %#', async (options, message) => {
    await expect(
      waitForExpectedReleaseNavigation({
        navigate: async () => undefined,
        ...options,
      }),
    ).rejects.toThrow(message);
  });

  it('uses the lockfile-pinned Playwright Chromium and fails when absent', () => {
    const executablePath = playwrightChromiumExecutablePath();
    expect(executablePath).toBe(chromium.executablePath());
    expect(existsSync(executablePath)).toBe(true);
    expect(() =>
      assertPlaywrightChromiumExecutable(
        join(tmpdir(), 'wejammin-missing-chromium'),
      ),
    ).toThrow('Pinned Playwright Chromium executable is unavailable.');
  });

  it('rejects absolute, traversal, workspace, and symlink-escaping report roots', () => {
    const root = mkdtempSync(join(tmpdir(), 'wejammin-ac266-root-'));
    const outside = mkdtempSync(join(tmpdir(), 'wejammin-ac266-outside-'));
    try {
      symlinkSync(outside, join(root, 'linked'), 'dir');
      expect(resolveReportRoot('promotion-candidate', root)).toBe(
        join(root, 'promotion-candidate'),
      );
      expect(() => resolveReportRoot('/tmp/outside', root)).toThrow(
        'relative path inside GITHUB_WORKSPACE',
      );
      expect(() => resolveReportRoot('../outside', root)).toThrow(
        'relative path inside GITHUB_WORKSPACE',
      );
      expect(() => resolveReportRoot('.', root)).toThrow(
        'relative path inside GITHUB_WORKSPACE',
      );
      expect(() => resolveReportRoot('linked/report', root)).toThrow(
        'symlink escapes',
      );
    } finally {
      rmSync(root, { force: true, recursive: true });
      rmSync(outside, { force: true, recursive: true });
    }
  });
});
