import {
  endpointFor,
  isJsonObject,
  requestJsonWithLink,
} from './content-schema-registry-slo-source-helpers.ts';
import type { JsonObject } from './content-schema-registry-slo-source-helpers.ts';

const PAGE_SIZE = 100;
const MAX_STATUS_PAGES = 10;
const MAX_LINK_HEADER_BYTES = 16_384;
const PAGINATION_ERROR = 'GitHub deployment status pagination is invalid.';
const RELATIONS = ['first', 'prev', 'next', 'last'] as const;

type StatusOptions = Readonly<{
  base: URL;
  owner: string;
  name: string;
  deploymentId: string;
  token: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;
}>;

type PaginationLinks = Readonly<{
  nextPage: number | undefined;
  lastPage: number | undefined;
}>;

type StatusSnapshot = Readonly<{
  statuses: readonly JsonObject[];
  signature: string;
}>;

const failPagination = (): never => {
  throw new Error(PAGINATION_ERROR);
};

const pageEndpoint = (options: StatusOptions, page: number): URL =>
  endpointFor(
    options.base,
    options.owner,
    options.name,
    `deployments/${options.deploymentId}/statuses?per_page=${PAGE_SIZE}&page=${page}`,
  );

const pageFromLinkTarget = (
  target: string,
  options: StatusOptions,
  expectedPath: string,
): number => {
  const match = /^https:\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?(?:#.*)?$/u.exec(
    target,
  );
  if (
    match === null ||
    match[1] !== 'api.github.com' ||
    match[2] !== expectedPath ||
    target.includes('#')
  )
    return failPagination();
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return failPagination();
  }
  if (
    parsed.origin !== options.base.origin ||
    parsed.username !== '' ||
    parsed.password !== '' ||
    parsed.pathname !== expectedPath ||
    parsed.hash !== ''
  )
    return failPagination();

  const perPage = parsed.searchParams.getAll('per_page');
  const pageValues = parsed.searchParams.getAll('page');
  const keys = [...parsed.searchParams.keys()];
  if (
    keys.length !== 2 ||
    perPage.length !== 1 ||
    perPage[0] !== String(PAGE_SIZE) ||
    pageValues.length !== 1 ||
    !/^[1-9][0-9]*$/u.test(pageValues[0] ?? '')
  )
    return failPagination();
  const page = Number(pageValues[0]);
  if (!Number.isSafeInteger(page)) return failPagination();
  return page;
};

const parsePaginationLinks = (
  link: string | null,
  currentPage: number,
  options: StatusOptions,
  expectedPath: string,
): PaginationLinks => {
  if (link === null) return { nextPage: undefined, lastPage: undefined };
  if (link.length === 0 || link.length > MAX_LINK_HEADER_BYTES)
    return failPagination();

  const relations = new Map<string, number>();
  const entries = link.split(/,(?=\s*<)/u);
  for (const entry of entries) {
    const match =
      /^<([^<>]+)>\s*;\s*rel=(?:"(first|prev|next|last)"|(first|prev|next|last))$/u.exec(
        entry.trim(),
      );
    if (match === null) return failPagination();
    const relation = match[2] ?? match[3];
    if (relation === undefined || relations.has(relation))
      return failPagination();
    const targetPage = pageFromLinkTarget(
      match[1] ?? '',
      options,
      expectedPath,
    );
    if (
      !RELATIONS.includes(relation as (typeof RELATIONS)[number]) ||
      (relation === 'first' && targetPage !== 1) ||
      (relation === 'prev' && targetPage !== currentPage - 1) ||
      (relation === 'next' && targetPage !== currentPage + 1) ||
      (relation === 'last' && targetPage < currentPage)
    )
      return failPagination();
    relations.set(relation, targetPage);
  }

  const nextPage = relations.get('next');
  const lastPage = relations.get('last');
  if (
    (lastPage !== undefined &&
      (currentPage > lastPage ||
        (nextPage !== undefined && nextPage > lastPage))) ||
    (lastPage !== undefined &&
      currentPage < lastPage !== (nextPage !== undefined))
  )
    return failPagination();
  return { nextPage, lastPage };
};

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value))
    return `[${value.map((item) => canonicalJson(item)).join(',')}]`;
  if (isJsonObject(value))
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
};

const readSnapshot = async (
  options: StatusOptions,
): Promise<StatusSnapshot> => {
  const firstPageEndpoint = pageEndpoint(options, 1);
  const expectedPath = firstPageEndpoint.pathname;
  const statuses: JsonObject[] = [];
  const pageSignatures: string[] = [];
  const statusIds = new Set<number>();
  let page = 1;
  let expectedLastPage: number | undefined;

  while (true) {
    if (page > MAX_STATUS_PAGES) return failPagination();
    const response = await requestJsonWithLink(
      pageEndpoint(options, page),
      options.token,
      options.fetchImpl,
      options.timeoutMs,
      'deployment status page',
    );
    if (
      !Array.isArray(response.value) ||
      response.value.length > PAGE_SIZE ||
      (page > 1 && response.value.length === 0)
    )
      return failPagination();

    const pageStatuses: JsonObject[] = [];
    for (const candidate of response.value) {
      if (
        !isJsonObject(candidate) ||
        typeof candidate.id !== 'number' ||
        !Number.isSafeInteger(candidate.id) ||
        candidate.id <= 0 ||
        statusIds.has(candidate.id)
      )
        return failPagination();
      statusIds.add(candidate.id);
      pageStatuses.push(candidate);
    }

    const links = parsePaginationLinks(
      response.link,
      page,
      options,
      expectedPath,
    );
    if (links.lastPage !== undefined) {
      if (expectedLastPage !== undefined && expectedLastPage !== links.lastPage)
        return failPagination();
      expectedLastPage = links.lastPage;
    } else if (expectedLastPage !== undefined && response.link !== null) {
      return failPagination();
    }
    if (links.nextPage !== undefined && pageStatuses.length !== PAGE_SIZE)
      return failPagination();

    statuses.push(...pageStatuses);
    pageSignatures.push(
      canonicalJson({
        page,
        nextPage: links.nextPage ?? null,
        lastPage: links.lastPage ?? null,
        statuses: pageStatuses,
      }),
    );

    if (links.nextPage === undefined) break;
    if (links.nextPage > MAX_STATUS_PAGES) return failPagination();
    page = links.nextPage;
  }

  if (expectedLastPage !== undefined && page !== expectedLastPage)
    return failPagination();
  return { statuses, signature: JSON.stringify(pageSignatures) };
};

export const collectDeploymentStatuses = async (
  options: StatusOptions,
): Promise<readonly JsonObject[]> => {
  const first = await readSnapshot(options);
  const second = await readSnapshot(options);
  if (first.signature !== second.signature) return failPagination();
  return second.statuses;
};
