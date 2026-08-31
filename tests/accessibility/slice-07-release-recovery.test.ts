import { readFileSync } from 'node:fs';

import { describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_MAINTENANCE_PROJECTION,
  DEFAULT_RECOVERY_PROJECTION,
  DEFAULT_RELEASE_PROJECTION,
} from '../../apps/web/src/components/release-recovery/status-projection.ts';
import {
  deriveReleaseRecoveryState,
  recoveryArtifactMatchesRelease,
  recoveryEvidenceComplete,
  releaseEvidenceComplete,
  resolveLastKnownGood,
} from '../../apps/web/src/components/release-recovery/status-view.ts';
import {
  installReleaseRecoveryStatusFocus,
  STATUS_UPDATED_EVENT,
} from '../../apps/web/src/lib/release-recovery-status-focus.ts';

const statusSource = readFileSync(
  new URL(
    '../../apps/web/src/components/release-recovery/ReleaseRecoveryStatus.astro',
    import.meta.url,
  ),
  'utf8',
);
const focusSource = readFileSync(
  new URL(
    '../../apps/web/src/lib/release-recovery-status-focus.ts',
    import.meta.url,
  ),
  'utf8',
);

describe('S07 release and recovery status accessibility', () => {
  it('keeps every evidence state visible in a named live region', () => {
    expect(statusSource).toContain('data-status-state={state}');
    expect(statusSource).toContain('data-status-state={state}');
    expect(statusSource).toContain('role="status"');
    expect(statusSource).toContain('aria-live="polite"');
    expect(statusSource).toContain('aria-atomic="true"');
    expect(statusSource).toContain('data-status-heading');
    expect(focusSource).toContain('focus({ preventScroll: true })');
    expect(focusSource).toContain(
      'documentRef.activeElement !== documentRef.body',
    );
  });

  it('provides keyboard-safe retry and back actions without a mutation handler', () => {
    expect(statusSource).toContain('data-recovery-retry');
    expect(statusSource).toContain('data-recovery-back');
    expect(statusSource).toContain('Retry safe status read');
    expect(statusSource).toContain('Back to safe route');
    expect(statusSource).not.toMatch(/fetch\s*\(/u);
    expect(statusSource).not.toMatch(/provider\.(send|activate)\s*\(/u);
  });

  it('uses truthful fail-closed defaults for unavailable recovery evidence', () => {
    expect(DEFAULT_RELEASE_PROJECTION).toMatchObject({
      status: 'blocked',
      artifactDigest: null,
    });
    expect(DEFAULT_RECOVERY_PROJECTION).toMatchObject({
      status: 'blocked',
      pitrAvailable: null,
      measuredRpoSeconds: null,
      measuredRtoSeconds: null,
      protectedWrites: 'disabled',
    });
    expect(DEFAULT_MAINTENANCE_PROJECTION).toMatchObject({
      status: 'unavailable',
      announcedAtLeast48HoursAhead: false,
      availabilityBasisPoints: null,
      unplannedDowntimeCounted: true,
    });
    expect(statusSource).toContain(
      'PITR unavailable; protected writes remain disabled.',
    );
    expect(statusSource).toContain('Unavailable; no verified RPO measurement.');
    expect(statusSource).toContain('Unavailable; no verified RTO measurement.');
  });

  it('derives every rendered state and fails closed for unknown or incomplete evidence', () => {
    const complete = {
      releaseStatus: 'success',
      recoveryStatus: 'success',
      releaseEvidenceComplete: true,
      recoveryEvidenceComplete: true,
      protectedWritesEnabled: true,
      checksVerified: true,
      artifactBound: true,
    };

    expect(
      deriveReleaseRecoveryState({ ...complete, releaseStatus: 'loading' }),
    ).toBe('loading');
    expect(
      deriveReleaseRecoveryState({ ...complete, recoveryStatus: 'error' }),
    ).toBe('error');
    expect(
      deriveReleaseRecoveryState({ ...complete, checksVerified: false }),
    ).toBe('blocked');
    expect(
      deriveReleaseRecoveryState({ ...complete, artifactBound: false }),
    ).toBe('blocked');
    expect(
      deriveReleaseRecoveryState({
        ...complete,
        protectedWritesEnabled: false,
      }),
    ).toBe('blocked');
    expect(
      deriveReleaseRecoveryState({ ...complete, releaseStatus: 'unknown' }),
    ).toBe('blocked');
    expect(
      deriveReleaseRecoveryState({ ...complete, releaseStatus: 'blocked' }),
    ).toBe('blocked');
    expect(deriveReleaseRecoveryState(complete)).toBe('success');
    expect(resolveLastKnownGood('2026-08-30T12:00:00.000Z')).toEqual({
      status: 'available',
      verifiedAt: '2026-08-30T12:00:00.000Z',
    });
    expect(resolveLastKnownGood('not-a-timestamp')).toEqual({
      status: 'unavailable',
      verifiedAt: null,
    });
    expect(deriveReleaseRecoveryState(null)).toBe('blocked');
    expect(deriveReleaseRecoveryState({ releaseStatus: 'blocked' })).toBe(
      'blocked',
    );
  });

  it('requires complete, matching release and recovery evidence', () => {
    const release = {
      ...DEFAULT_RELEASE_PROJECTION,
      status: 'success' as const,
      environment: 'production' as const,
      artifactDigest: 'sha256:release',
      sourceRevision: 'revision-1',
      verifiedAt: '2026-08-30T12:00:00.000Z',
    };
    const recovery = {
      ...DEFAULT_RECOVERY_PROJECTION,
      status: 'success' as const,
      environment: 'production' as const,
      artifactDigest: 'sha256:release',
      sourceRevision: 'revision-1',
      artifactBound: true,
      checksVerified: true,
      pitrAvailable: true,
      pitrRetentionDays: 7,
      measuredRpoSeconds: 120,
      measuredRtoSeconds: 14_400,
      protectedWrites: 'enabled' as const,
      verifiedAt: '2026-08-30T12:00:00.000Z',
    };
    expect(releaseEvidenceComplete(release)).toBe(true);
    expect(recoveryEvidenceComplete(recovery)).toBe(true);
    expect(recoveryArtifactMatchesRelease(release, recovery)).toBe(true);
    expect(releaseEvidenceComplete({ ...release, artifactDigest: null })).toBe(
      false,
    );
    expect(
      recoveryEvidenceComplete({ ...recovery, measuredRpoSeconds: null }),
    ).toBe(false);
    expect(
      recoveryArtifactMatchesRelease(release, {
        ...recovery,
        artifactBound: false,
      }),
    ).toBe(false);
    expect(
      recoveryArtifactMatchesRelease(release, {
        ...recovery,
        environment: 'staging',
      }),
    ).toBe(false);
    expect(
      recoveryArtifactMatchesRelease(release, {
        ...recovery,
        artifactDigest: 'sha256:other',
      }),
    ).toBe(false);
    expect(
      recoveryArtifactMatchesRelease(release, {
        ...recovery,
        sourceRevision: 'revision-2',
      }),
    ).toBe(false);
  });

  it('updates status focus only when the document body owns focus', () => {
    const listeners = new Map<string, EventListener>();
    const focus = vi.fn();
    const heading = {
      focus,
    } as unknown as HTMLElement;
    const root = {
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        listeners.set(event, listener);
      }),
      querySelector: vi.fn(() => heading),
    } as unknown as HTMLElement;
    const body = {} as HTMLElement;
    const documentRef = {
      activeElement: body,
      body,
      querySelectorAll: vi.fn(() => [root]),
    } as unknown as Document;

    installReleaseRecoveryStatusFocus(documentRef);
    listeners.get(STATUS_UPDATED_EVENT)?.({} as Event);
    expect(focus).toHaveBeenCalledWith({ preventScroll: true });

    documentRef.activeElement = {} as Element;
    listeners.get(STATUS_UPDATED_EVENT)?.({} as Event);
    expect(focus).toHaveBeenCalledTimes(1);

    const noHeading = {
      addEventListener: vi.fn((event: string, listener: EventListener) => {
        listeners.set(event, listener);
      }),
      querySelector: vi.fn(() => null),
    } as unknown as HTMLElement;
    const noHeadingDocument = {
      activeElement: body,
      body,
      querySelectorAll: vi.fn(() => [noHeading]),
    } as unknown as Document;
    installReleaseRecoveryStatusFocus(noHeadingDocument);
    listeners.get(STATUS_UPDATED_EVENT)?.({} as Event);
  });

  it('installs the browser bootstrap when a document is available', async () => {
    const documentRef = {
      activeElement: null,
      body: {},
      querySelectorAll: vi.fn(() => []),
    } as unknown as Document;
    const globalScope = globalThis as typeof globalThis & {
      document?: Document;
    };
    const previousDocument = globalScope.document;
    globalScope.document = documentRef;
    try {
      await import('../../apps/web/src/lib/release-recovery-status-focus.ts?browser-bootstrap');
    } finally {
      globalScope.document = previousDocument;
    }
    expect(documentRef.querySelectorAll).toHaveBeenCalledWith(
      '[data-release-recovery-status]',
    );
  });
});
