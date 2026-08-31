import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const systemSource = readFileSync(
  new URL('../../apps/web/src/components/SystemStatus.astro', import.meta.url),
  'utf8',
);
const degradedSource = readFileSync(
  new URL('../../apps/web/src/pages/system/degraded.astro', import.meta.url),
  'utf8',
);
const projectionSource = readFileSync(
  new URL(
    '../../apps/web/src/components/release-recovery/status-projection.ts',
    import.meta.url,
  ),
  'utf8',
);
const statusComponentSource = readFileSync(
  new URL(
    '../../apps/web/src/components/release-recovery/ReleaseRecoveryStatus.astro',
    import.meta.url,
  ),
  'utf8',
);

describe('S07 release and recovery status integration', () => {
  it('passes explicit release, recovery, maintenance, retry, and back props', () => {
    expect(systemSource).toContain('release?: ReleasePromotionProjection;');
    expect(systemSource).toContain('recovery?: RecoveryReadinessProjection;');
    expect(systemSource).toContain('maintenance?: MaintenanceProjection;');
    expect(systemSource).toContain('<ReleaseRecoveryStatus');
    expect(systemSource).toContain('release={release}');
    expect(systemSource).toContain('recovery={recovery}');
    expect(systemSource).toContain('maintenance={maintenance}');
    expect(systemSource).toContain('retryHref={retryHref}');
    expect(systemSource).toContain('backHref={backHref}');
  });

  it('keeps degraded SSR defaults closed and canonical', () => {
    expect(degradedSource).toContain('DEFAULT_MAINTENANCE_PROJECTION');
    expect(degradedSource).toContain('DEFAULT_RECOVERY_PROJECTION');
    expect(degradedSource).toContain('DEFAULT_RELEASE_PROJECTION');
    expect(degradedSource).toContain('release={DEFAULT_RELEASE_PROJECTION}');
    expect(degradedSource).toContain('recovery={DEFAULT_RECOVERY_PROJECTION}');
    expect(degradedSource).toContain(
      'maintenance={DEFAULT_MAINTENANCE_PROJECTION}',
    );
    expect(degradedSource).toContain("const retryHref = '/system/degraded';");
    expect(degradedSource).toContain("const backHref = '/';");
    expect(degradedSource).not.toMatch(
      /searchParams\.get\(['"](?:state|pitr|rpo|rto)/u,
    );
    expect(projectionSource).toContain('checksVerified: boolean;');
    expect(projectionSource).toContain('artifactBound: boolean;');
  });

  it('documents maintenance notice and 99.9% objective evidence', () => {
    expect(projectionSource).toContain('announcedAtLeast48HoursAhead');
    expect(projectionSource).toContain('availabilityBasisPoints');
    expect(projectionSource).toContain('availabilityObjectiveBasisPoints');
    expect(projectionSource).toContain('unplannedDowntimeCounted');
    expect(statusComponentSource).toContain(
      '99.9% monthly availability objective',
    );
    expect(statusComponentSource).toContain('Unplanned downtime always counts');
  });
});
