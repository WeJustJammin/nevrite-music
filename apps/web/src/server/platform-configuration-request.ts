/** Validate browser origin metadata before a request crosses the service boundary. */
export const isSameOriginPlatformConfigurationRequest = (
  request: Request,
): boolean => {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');
  if (origin !== null && origin !== requestOrigin) return false;
  const referer = request.headers.get('referer');
  if (origin === null && referer !== null) {
    try {
      if (new URL(referer).origin !== requestOrigin) return false;
    } catch {
      return false;
    }
  }
  return true;
};
