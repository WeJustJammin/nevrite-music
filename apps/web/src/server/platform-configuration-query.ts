const copyAllowedQuery = (
  source: URL,
  target: URL,
  allowed: ReadonlySet<string>,
): void => {
  const query = new URLSearchParams();
  for (const [name, value] of source.searchParams) {
    if (allowed.has(name)) query.append(name, value);
  }
  target.search = query.toString();
};

export const appendEffectiveConfigurationQuery = (
  source: URL,
  target: URL,
): void =>
  copyAllowedQuery(
    source,
    target,
    new Set([
      'environment',
      'partyId',
      'siteId',
      'route',
      'feature',
      'userId',
      'consumerKey',
      'supportedDefinitionVersions',
      'at',
    ]),
  );

export const appendAdminInboxQuery = (source: URL, target: URL): void =>
  copyAllowedQuery(
    source,
    target,
    new Set(['cursor', 'limit', 'taskClasses', 'states', 'staleAfter']),
  );
