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

import { describe, expect, it } from 'vitest';

import {
  assertPlaywrightChromiumExecutable,
  playwrightChromiumExecutablePath,
} from '../../infra/workflows/content-schema-registry-axe-browser.ts';
import {
  assertExpectedAxeNavigation,
  assertExpectedReleaseHeader,
  isApprovedHostedDocumentUrl,
  relativePathFromHostedUrl,
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
    expect(collectorSource).toContain(
      'relativePathFromHostedUrl(page.url(), expectedOrigin)',
    );
    expect(collectorSource).not.toContain('new URL(page.url()).pathname');
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
