const TRUSTED_GITHUB_API_ORIGIN = 'https://api.github.com';
const CANONICAL_GITHUB_API_URL = `${TRUSTED_GITHUB_API_ORIGIN}/`;
const API_URL_ERROR =
  'GITHUB_API_URL must use the canonical https://api.github.com/ origin.';

export const trustedGitHubApiBase = (apiUrl: string): URL => {
  const match = /^https:\/\/([^/?#]*)([^?#]*)(?:[?#].*)?$/u.exec(apiUrl);
  if (match === null) throw new Error(API_URL_ERROR);

  let parsed: URL;
  try {
    parsed = new URL(apiUrl);
  } catch {
    throw new Error(API_URL_ERROR);
  }

  const [, authority, path] = match;
  if (
    authority !== 'api.github.com' ||
    (path !== '' && path !== '/') ||
    /[?#]/u.test(apiUrl) ||
    parsed.origin !== TRUSTED_GITHUB_API_ORIGIN ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.pathname !== '/' ||
    parsed.search !== '' ||
    parsed.hash !== ''
  )
    throw new Error(API_URL_ERROR);

  return new URL(CANONICAL_GITHUB_API_URL);
};
