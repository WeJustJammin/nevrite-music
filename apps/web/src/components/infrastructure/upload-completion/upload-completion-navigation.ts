import { uploadCompletionHref } from './upload-completion-state';

const ROUTE = '/app/infrastructure/upload-completion';
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

const safeIntentId = (value: string): string | null =>
  UUID_PATTERN.test(value) ? value : null;

export const uploadCompletionFieldId = (field: string): string =>
  `upload-completion-${field
    .replaceAll('.', '-')
    .replace(/[A-Z]/gu, (character) => `-${character.toLowerCase()}`)}`;

/** Keeps Back navigation on the canonical intent route and query only. */
export const uploadCompletionBackHref = (
  href: string | undefined,
  uploadIntentId: string,
): string => {
  const fallbackId = safeIntentId(uploadIntentId);
  const fallback =
    fallbackId === null ? ROUTE : uploadCompletionHref(fallbackId);
  if (href === undefined) return fallback;
  try {
    const parsed = new URL(href, 'https://wejammin.invalid');
    if (
      parsed.origin !== 'https://wejammin.invalid' ||
      parsed.pathname !== ROUTE ||
      parsed.hash !== '' ||
      parsed.searchParams.getAll('uploadIntentId').length !== 1 ||
      [...parsed.searchParams.keys()].some((key) => key !== 'uploadIntentId')
    )
      return fallback;
    const hrefId = safeIntentId(
      String(parsed.searchParams.get('uploadIntentId')),
    );
    return hrefId === null ? fallback : uploadCompletionHref(hrefId);
  } catch {
    return fallback;
  }
};
