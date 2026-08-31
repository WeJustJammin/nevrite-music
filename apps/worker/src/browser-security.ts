import { BrowserMutationSecurityHeadersSchema } from '@wejammin/contracts';

export type BrowserMutationSecurityResult =
  | Readonly<{ ok: true; origin: string }>
  | Readonly<{ ok: false; reason: 'BROWSER_SECURITY_REJECTED' }>;

export type BrowserMutationSecurityPolicy = Readonly<{
  allowedOrigins: ReadonlySet<string>;
  expectedCsrfToken: string;
}>;

const constantTimeEqual = (left: string, right: string): boolean => {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  const maximumLength = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < maximumLength; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }

  return difference === 0;
};

export const verifyBrowserMutationSecurity = (
  request: Request,
  policy: BrowserMutationSecurityPolicy,
): BrowserMutationSecurityResult => {
  const parsed = BrowserMutationSecurityHeadersSchema.safeParse({
    origin: request.headers.get('origin'),
    csrfToken: request.headers.get('x-csrf-token'),
  });

  if (
    !parsed.success ||
    !policy.allowedOrigins.has(parsed.data.origin) ||
    !constantTimeEqual(parsed.data.csrfToken, policy.expectedCsrfToken)
  ) {
    return { ok: false, reason: 'BROWSER_SECURITY_REJECTED' };
  }

  return { ok: true, origin: parsed.data.origin };
};

export const withOriginVariance = (response: Response): Response => {
  const headers = new Headers(response.headers);
  const variance = headers.get('vary');
  const values =
    variance
      ?.split(',')
      .map((value) => value.trim())
      .filter((value) => value.length > 0) ?? [];
  if (!values.some((value) => value.toLowerCase() === 'origin')) {
    values.push('Origin');
  }
  headers.set('vary', values.join(', '));

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};
