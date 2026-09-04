export interface LinkedValidationSummary {
  readonly heading: 'Check the highlighted fields.';
  readonly firstInvalidPath: string;
  readonly links: readonly Readonly<{ href: string; path: string }>[];
}

export function buildLinkedValidationSummary(
  errors: Readonly<Record<string, string>>,
): LinkedValidationSummary {
  const paths = Object.keys(errors).filter((path) => path.length > 0);
  const firstInvalidPath = paths[0] ?? '';
  return {
    heading: 'Check the highlighted fields.',
    firstInvalidPath,
    links: paths.map((path) => ({
      href: `#field-${path.replace(/^\//u, '').replaceAll('/', '-')}`,
      path,
    })),
  };
}
