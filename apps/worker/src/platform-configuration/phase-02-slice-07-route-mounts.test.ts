import { createLogger } from '@wejammin/observability/logging';
import { describe, expect, it } from 'vitest';

import { createWorkerApp } from '../index';

describe('Phase 2 Slice 07 route mount gate', () => {
  it.each([
    ['POST', '/api/v1/internal/config/definitions'],
    ['GET', '/api/v1/config/profile.visibility/effective'],
    [
      'POST',
      '/api/v1/admin/settings/018f2f72-4b5a-7c9d-8e1f-123456789abc/changes',
    ],
    [
      'POST',
      '/api/v1/admin/settings/changes/018f2f72-4b5a-7c9d-8e1f-123456789abc/actions',
    ],
  ] as const)(
    'mounts %s %s instead of the fallback route',
    async (method, path) => {
      const app = createWorkerApp({
        captureException: () => undefined,
        createLogger: () =>
          createLogger({
            environment: 'test',
            release: 'slice-07',
            service: 'worker',
          }),
        now: () => 0,
      });
      const response = await app.request(
        new Request(`https://api.wejammin.test${path}`, { method }),
      );
      expect(response.status).not.toBe(404);
    },
  );
});
