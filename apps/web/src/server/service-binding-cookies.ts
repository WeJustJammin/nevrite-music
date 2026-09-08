type RuntimeCookieHeaders = Headers & {
  getAll?: (name: string) => string[];
  getSetCookie?: () => string[];
};

const cookieName = (cookie: string): string | null => {
  const separator = cookie.indexOf('=');
  return separator > 0 ? cookie.slice(0, separator).trim() : null;
};

const distinctSetCookies = (source: Response): readonly string[] => {
  const headers = source.headers as RuntimeCookieHeaders;
  const workerCookies = headers.getAll?.('Set-Cookie') ?? [];
  return workerCookies.length > 0
    ? workerCookies
    : (headers.getSetCookie?.() ?? []);
};

/**
 * Copies distinct, allowlisted cookies from a private service-binding response.
 * Runtimes without a multi-value cookie API fail closed; folded Set-Cookie
 * values cannot be parsed safely because cookie attributes may contain commas.
 */
export const appendAllowedServiceBindingCookies = (
  source: Response,
  target: Headers,
  allowedNames: ReadonlySet<string>,
): void => {
  for (const cookie of distinctSetCookies(source)) {
    const name = cookieName(cookie);
    if (name !== null && allowedNames.has(name)) {
      target.append('set-cookie', cookie);
    }
  }
};
