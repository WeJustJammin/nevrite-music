import { describe, expect, it } from 'vitest';

import {
  evaluateAvailabilityObjective,
  evaluateMaintenanceNotice,
} from './availability.ts';

const NOTICE = {
  kind: 'scheduled' as const,
  noticeId: '22222222-2222-4222-8222-222222222222',
  scope: ['service', 'publication'] as const,
  announcedAt: '2026-08-30T00:00:00.000Z',
  windowStartsAt: '2026-09-01T00:00:00.000Z',
  windowEndsAt: '2026-09-01T02:00:00.000Z',
  status: 'scheduled' as const,
} as const;

describe('availability and maintenance policy', () => {
  it('recognizes a valid 48-hour maintenance notice', () => {
    expect(evaluateMaintenanceNotice(NOTICE)).toEqual({
      status: 'scheduled',
      notice: NOTICE,
      announcedAtLeast48HoursAhead: true,
    });
  });

  it('does not create an exclusion for malformed or late notices', () => {
    expect(evaluateMaintenanceNotice(null)).toEqual({
      status: 'invalid',
      announcedAtLeast48HoursAhead: false,
    });
    expect(
      evaluateMaintenanceNotice({
        ...NOTICE,
        windowStartsAt: '2026-08-31T23:59:59.000Z',
      }),
    ).toEqual({
      status: 'invalid',
      announcedAtLeast48HoursAhead: false,
    });
  });

  it('excludes announced maintenance while counting every unplanned outage', () => {
    expect(
      evaluateAvailabilityObjective({
        windowSeconds: 2_592_000,
        scheduledMaintenanceSeconds: 3_600,
        unplannedDowntimeSeconds: 60,
        maintenanceNotice: NOTICE,
      }),
    ).toEqual({
      status: 'measured',
      objectiveBasisPoints: 9_990,
      availabilityBasisPoints: 9_999,
      countedDowntimeSeconds: 60,
      scheduledMaintenanceExcluded: true,
      unplannedDowntimeCounted: true,
      meetsObjective: true,
    });
  });

  it('counts unannounced maintenance and fails the objective when availability is below 99.9%', () => {
    expect(
      evaluateAvailabilityObjective({
        windowSeconds: 10_000,
        scheduledMaintenanceSeconds: 100,
        unplannedDowntimeSeconds: 100,
        maintenanceNotice: null,
      }),
    ).toEqual({
      status: 'measured',
      objectiveBasisPoints: 9_990,
      availabilityBasisPoints: 9_800,
      countedDowntimeSeconds: 200,
      scheduledMaintenanceExcluded: false,
      unplannedDowntimeCounted: true,
      meetsObjective: false,
    });
  });

  it('fails closed for malformed objective inputs', () => {
    expect(evaluateAvailabilityObjective(null)).toEqual({
      status: 'invalid',
      objectiveBasisPoints: 9_990,
      availabilityBasisPoints: null,
      countedDowntimeSeconds: null,
      scheduledMaintenanceExcluded: false,
      unplannedDowntimeCounted: true,
      meetsObjective: false,
    });
    expect(
      evaluateAvailabilityObjective({
        windowSeconds: 10,
        scheduledMaintenanceSeconds: 11,
        unplannedDowntimeSeconds: 0,
        maintenanceNotice: NOTICE,
      }),
    ).toMatchObject({ status: 'invalid' });
    expect(
      evaluateAvailabilityObjective({
        windowSeconds: 10,
        scheduledMaintenanceSeconds: 10,
        unplannedDowntimeSeconds: 0,
        maintenanceNotice: NOTICE,
      }),
    ).toEqual({
      status: 'invalid',
      objectiveBasisPoints: 9_990,
      availabilityBasisPoints: null,
      countedDowntimeSeconds: null,
      scheduledMaintenanceExcluded: false,
      unplannedDowntimeCounted: true,
      meetsObjective: false,
    });
  });

  it('fails closed instead of excluding maintenance without a valid notice', () => {
    expect(
      evaluateAvailabilityObjective({
        windowSeconds: 10_000,
        scheduledMaintenanceSeconds: 100,
        unplannedDowntimeSeconds: 0,
        maintenanceNotice: {
          ...NOTICE,
          windowStartsAt: '2026-08-31T23:59:59.000Z',
        },
      }),
    ).toEqual({
      status: 'invalid',
      objectiveBasisPoints: 9_990,
      availabilityBasisPoints: null,
      countedDowntimeSeconds: null,
      scheduledMaintenanceExcluded: false,
      unplannedDowntimeCounted: true,
      meetsObjective: false,
    });
  });
});
