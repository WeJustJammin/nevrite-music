import type { ProfilePortfolioPlatformApiBinding } from './profile-portfolio-platform-api.ts';

/** Create an HTTP-backed binding for the explicitly configured local API. */
export const createProfilePortfolioHttpBinding = (
  origin: string,
): ProfilePortfolioPlatformApiBinding => {
  const base = new URL(origin);
  if (base.username !== '' || base.password !== '')
    throw new TypeError(
      'Local profile API origin must not contain credentials.',
    );
  return {
    fetch: (input, init) => {
      const source =
        input instanceof Request
          ? new URL(input.url)
          : new URL(input instanceof URL ? input.href : input);
      const target = new URL(source.pathname + source.search, base);
      return globalThis.fetch(new Request(target, init));
    },
  };
};
