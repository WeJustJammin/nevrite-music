import { parseProfilePortfolioError } from './profile-portfolio-workbench-transport';
import type { ProfilePortfolioError } from './profile-portfolio-workbench-types';

export const readCanonicalProfileError = async (
  partyId: string | null,
): Promise<ProfilePortfolioError | null> => {
  if (partyId === null || partyId.length === 0) return null;
  try {
    const response = await fetch(
      `/api/v1/profiles/${encodeURIComponent(partyId)}`,
      {
        method: 'GET',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      },
    );
    return response.ok ? null : parseProfilePortfolioError(response);
  } catch {
    return {
      code: 'DEPENDENCY_UNAVAILABLE',
      message: 'Current profile data is temporarily unavailable.',
      requestId: 'canonical-read',
    };
  }
};
