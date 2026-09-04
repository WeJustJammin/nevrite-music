import { expect } from 'vitest';

import {
  auditReadRequest,
  capabilityActionRequest,
  diagnosticRunRequest,
  BASE_URL,
  ORIGIN,
  REQUEST_ID,
  CORRELATION_ID,
} from './phase-02-slice-08-worker.fixtures';

export type TestHeaders = Readonly<Record<string, string | undefined>>;

export const request = (
  path: string,
  init: RequestInit = {},
  headers: TestHeaders = {},
): Request => {
  const requestHeaders = new Headers(init.headers);
  requestHeaders.set(
    'accept',
    requestHeaders.get('accept') ?? 'application/json',
  );
  requestHeaders.set('origin', requestHeaders.get('origin') ?? ORIGIN);
  requestHeaders.set('x-request-id', REQUEST_ID);
  requestHeaders.set('x-correlation-id', CORRELATION_ID);
  for (const [name, value] of Object.entries(headers)) {
    if (value === undefined) requestHeaders.delete(name);
    else requestHeaders.set(name, value);
  }
  return new Request(`${BASE_URL}${path}`, {
    ...init,
    headers: requestHeaders,
  });
};

export const jsonRequest = (
  path: string,
  body: unknown,
  headers: TestHeaders = {},
): Request =>
  request(
    path,
    { method: 'POST', body: JSON.stringify(body) },
    {
      authorization: 'Bearer verified-session',
      'content-type': 'application/json',
      ...headers,
    },
  );

export const inboxRequest = (query = '', headers: TestHeaders = {}): Request =>
  request(`/api/v1/admin/inbox${query}`, {
    method: 'GET',
    headers: { authorization: 'Bearer verified-session', ...headers },
  });

export const capabilityRequest = (
  body: unknown = capabilityActionRequest,
  headers: TestHeaders = {},
): Request =>
  jsonRequest('/api/v1/admin/capability-grants/actions', body, {
    'idempotency-key': 'slice08-capability-action',
    ...headers,
  });

export const auditRequest = (
  body: unknown = auditReadRequest,
  headers: TestHeaders = {},
): Request =>
  jsonRequest('/api/v1/admin/audit-diagnostics/actions', body, {
    'idempotency-key': 'slice08-audit-read',
    'if-match': '"4"',
    ...headers,
  });

export const diagnosticRequest = (
  body: unknown = diagnosticRunRequest,
  headers: TestHeaders = {},
): Request =>
  jsonRequest('/api/v1/admin/audit-diagnostics/actions', body, {
    'idempotency-key': 'slice08-diagnostic-run',
    ...headers,
  });

export const expectApiError = async (
  response: Response,
  status: number,
  code: string,
): Promise<Record<string, unknown>> => {
  expect(response.status).toBe(status);
  expect(response.headers.get('cache-control')).toBe('no-store');
  const body = (await response.json()) as Record<string, unknown>;
  expect(body).toEqual(
    expect.objectContaining({ code, requestId: REQUEST_ID }),
  );
  expect(body.message).toEqual(expect.any(String));
  return body;
};

export const telemetryEvents = (
  lines: readonly string[],
): readonly Record<string, unknown>[] =>
  lines
    .map((line) => JSON.parse(line) as Record<string, unknown>)
    .filter((event) =>
      [
        'admin.inbox.read',
        'admin.capability.changed',
        'quality.diagnostic.changed',
      ].includes(String(event.eventName)),
    );
