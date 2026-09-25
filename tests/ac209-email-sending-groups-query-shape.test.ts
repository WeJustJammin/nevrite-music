import { describe, expect, it } from 'vitest';

import {
  AC209_EMAIL_SENDING_GROUPS_DATASET,
  AC209_EMAIL_SENDING_GROUPS_MAX_ROWS,
  AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS,
  AC209_EMAIL_SENDING_GROUPS_QUERY,
} from '../infra/workflows/ac209-email-sending-groups-contract.ts';

/**
 * The query text is the first half of this probe's safety story: it decides
 * which provider fields can ever be read. The collector's behaviour against
 * that text is covered by `./ac209-email-sending-groups-rows.test.ts` and
 * `./ac209-email-sending-groups-window.test.ts`.
 */
describe('AC209 Email Sending groups query shape', () => {
  it('uses the documented hourly aggregated dataset with Time hour filters', () => {
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain(
      'emailSendingAdaptiveGroups(',
    );
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain(
      'datetimeHour_geq: $start',
    );
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain(
      'datetimeHour_leq: $end',
    );
    // The hourly dataset takes Time filters, never the Date day-level forms.
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).not.toContain('date_geq');
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).not.toContain('date_leq');
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain('count');
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain('dimensions {');
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain('datetimeHour');
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain('status');
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain(
      `limit: ${String(AC209_EMAIL_SENDING_GROUPS_MAX_ROWS)}`,
    );
    expect(AC209_EMAIL_SENDING_GROUPS_QUERY).toContain(
      'orderBy: [datetimeHour_ASC]',
    );
    expect(AC209_EMAIL_SENDING_GROUPS_DATASET).toBe(
      'emailSendingAdaptiveGroups',
    );
  });

  it('selects no address, subject, identifier, or domain dimension', () => {
    for (const field of [
      'from',
      'to',
      'subject',
      'messageId',
      'sendingDomain',
      'errorCause',
      'isLastEvent',
      'envelopeTo',
    ])
      expect(AC209_EMAIL_SENDING_GROUPS_QUERY).not.toMatch(
        new RegExp(`^\\s+${field}\\s*$`, 'mu'),
      );
  });

  it('caps the operator window so one page can hold every hourly bucket', () => {
    // 7 days is 168 hourly buckets, which fits the 512-row page with room for
    // several statuses per hour. The provider's advertised 30-day ceiling would
    // be 720 buckets, more than one page holds, so a request of that width would
    // always fail mid-flight instead of answering.
    expect(AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS).toBe(7 * 86_400_000);
    const hourlyBuckets = AC209_EMAIL_SENDING_GROUPS_MAX_WINDOW_MS / 3_600_000;
    expect(hourlyBuckets).toBe(168);
    // At least two statuses per hour must fit before the page is full.
    expect(hourlyBuckets * 2).toBeLessThan(AC209_EMAIL_SENDING_GROUPS_MAX_ROWS);
  });

  it('keeps the page bound inside the shared response cap', () => {
    // A "page is full" guard whose bound the response cap pre-empts would be
    // unreachable dead code, so the contract ties the two together at load.
    expect(AC209_EMAIL_SENDING_GROUPS_MAX_ROWS).toBe(512);
    expect(AC209_EMAIL_SENDING_GROUPS_MAX_ROWS * 400).toBeLessThan(262_144);
  });
});
