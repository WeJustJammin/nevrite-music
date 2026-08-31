import { createLogger } from '@wejammin/observability/logging';
import { describe, expect, it, vi } from 'vitest';

import { createWorkerApp, type WorkerBindings } from './index';
import {
  applySecurityHeaders,
  createHttpsRedirectResponse,
  generateRequestNonce,
  shouldRedirectToHttps,
} from './security-headers';

const bindings: WorkerBindings = {
  APP_ENVIRONMENT: 'staging',
  APP_RELEASE: 'security-test',
  SUPABASE_SECRET_KEY: 'sb_secret_test_only',
  SUPABASE_URL: 'https://staging.example.supabase.co',
};

const expectedHeaders = [
  'content-security-policy',
  'strict-transport-security',
  'x-content-type-options',
  'x-frame-options',
  'referrer-policy',
  'permissions-policy',
] as const;

describe('edge security headers', () => {
  it('generates an unguessable request nonce and applies the locked policy', () => {
    const nonce = generateRequestNonce();
    const response = applySecurityHeaders(new Response('ok'), nonce);

    expect(nonce).toMatch(/^[A-Za-z0-9_-]{22}$/u);
    expect(response.headers.get('strict-transport-security')).toBe(
      'max-age=63072000; includeSubDomains',
    );
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('referrer-policy')).toBe(
      'strict-origin-when-cross-origin',
    );
    expect(response.headers.get('permissions-policy')).toBe(
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), serial=(), hid=(), publickey-credentials-get=(self)',
    );
    expect(response.headers.get('content-security-policy')).toBe(
      `default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' 'nonce-${nonce}' 'strict-dynamic'; style-src 'self' 'nonce-${nonce}'; img-src 'self' data: blob: https://*.supabase.co; media-src 'self' blob: https://*.supabase.co; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.ingest.provider-native diagnostics.io; frame-src 'none'; worker-src 'self' blob:; manifest-src 'self'; upgrade-insecure-requests; report-to csp-endpoint`,
    );
  });

  it('redirects explicit insecure edge requests before route execution', async () => {
    const request = new Request(
      'http://api.example.test/api/v1/health?return=%2Fapp',
    );
    expect(shouldRedirectToHttps(request)).toBe(true);

    const response = createHttpsRedirectResponse(request);
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      'https://api.example.test/api/v1/health?return=%2Fapp',
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(
      shouldRedirectToHttps(
        new Request(request.url.replace('http:', 'https:')),
      ),
    ).toBe(false);
    expect(shouldRedirectToHttps(new Request('http://localhost:8787/'))).toBe(
      false,
    );
    expect(shouldRedirectToHttps(new Request('http://[::1]:8787/'))).toBe(
      false,
    );
  });

  it.each(['/api/v1/health', '/api/v1/not-found', '/api/v1/security-failure'])(
    'emits all security headers on %s responses',
    async (path) => {
      const app = createWorkerApp({
        captureException: vi.fn(),
        createLogger: () =>
          createLogger(
            {
              environment: 'staging',
              release: 'security-test',
              service: 'wejammin-api',
            },
            { sink: vi.fn() },
          ),
        now: () => 0,
      });
      if (path.endsWith('security-failure')) {
        app.get(path, () => {
          throw new Error('test-only failure');
        });
      }

      const response = await app.request(
        `https://api.example.test${path}`,
        {},
        bindings,
      );

      expect(response.status).toBe(
        path.endsWith('health') ? 200 : path.endsWith('failure') ? 500 : 404,
      );
      for (const header of expectedHeaders) {
        expect(response.headers.get(header), header).toBeTruthy();
      }
      expect(response.headers.get('content-security-policy')).toMatch(
        /'nonce-[A-Za-z0-9_-]{22}'/u,
      );
    },
  );

  it('emits all security headers on an HTTPS redirect response', async () => {
    const app = createWorkerApp({
      captureException: vi.fn(),
      createLogger: () =>
        createLogger(
          {
            environment: 'staging',
            release: 'security-test',
            service: 'wejammin-api',
          },
          { sink: vi.fn() },
        ),
      now: () => 0,
    });

    const response = await app.request(
      'http://api.example.test/api/v1/health',
      {},
      bindings,
    );

    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(
      'https://api.example.test/api/v1/health',
    );
    for (const header of expectedHeaders) {
      expect(response.headers.get(header), header).toBeTruthy();
    }
  });
});
