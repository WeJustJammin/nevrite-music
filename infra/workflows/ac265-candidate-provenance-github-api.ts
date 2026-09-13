import {
  AC265_REPOSITORY,
  failAc265CandidateProvenance,
  isAc265Record,
  requestAc265GitHubJson,
} from './ac265-candidate-provenance-common.ts';

const PAGE_SIZE = 100;
const MAX_PAGES = 10;

export const repositoryApiPrefix = (): string => {
  const [owner, name] = AC265_REPOSITORY.split('/');
  return `/repos/${encodeURIComponent(owner!)}/${encodeURIComponent(name!)}`;
};

export const requireSafeInteger = (value: unknown): number => {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0)
    return failAc265CandidateProvenance();
  return value;
};

export const collectPages = async (
  path: string,
  token: string,
  fetchImpl: typeof fetch,
): Promise<unknown[]> => {
  const output: unknown[] = [];
  let totalCount: number | undefined;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const separator = path.includes('?') ? '&' : '?';
    const value = await requestAc265GitHubJson(
      `${path}${separator}per_page=${PAGE_SIZE}&page=${page}`,
      token,
      fetchImpl,
    );
    if (Array.isArray(value)) {
      if (value.length > PAGE_SIZE) return failAc265CandidateProvenance();
      output.push(...value);
      if (value.length < PAGE_SIZE) return output;
      continue;
    }
    if (!isAc265Record(value) || !Array.isArray(value.artifacts))
      return failAc265CandidateProvenance();
    const count = value.total_count;
    if (
      typeof count !== 'number' ||
      !Number.isSafeInteger(count) ||
      count < 0 ||
      (totalCount !== undefined && totalCount !== count) ||
      value.artifacts.length > PAGE_SIZE
    )
      return failAc265CandidateProvenance();
    totalCount = count;
    output.push(...value.artifacts);
    if (value.artifacts.length < PAGE_SIZE) {
      if (output.length !== totalCount) return failAc265CandidateProvenance();
      return output;
    }
  }
  return failAc265CandidateProvenance();
};
