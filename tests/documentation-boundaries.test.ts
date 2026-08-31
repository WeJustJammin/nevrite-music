import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const documentationRoots = ['apps', 'packages', 'infra', 'tests', 'docs'];
const ignoredDirectoryNames = new Set([
  '.astro',
  '.cache',
  '.git',
  '.next',
  '.output',
  '.svelte-kit',
  '.wrangler',
  'build',
  'coverage',
  'dist',
  'generated',
  'node_modules',
  'vendor',
]);

const readText = (path: string): string => readFileSync(path, 'utf8');

const lineCount = (path: string): number => {
  const contents = readText(path);
  return contents.length === 0 ? 0 : contents.split(/\r?\n/u).length;
};

const walkDirectories = (root: string): string[] => {
  const directories: string[] = [];
  const visit = (directory: string): void => {
    directories.push(directory);
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || ignoredDirectoryNames.has(entry.name)) {
        continue;
      }
      visit(join(directory, entry.name));
    }
  };

  visit(root);
  return directories;
};

const directFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.name.endsWith('.tsbuildinfo'))
    .map((entry) => join(directory, entry.name));

const documentationDirectories = documentationRoots.flatMap((root) =>
  walkDirectories(join(repositoryRoot, root)),
);

const directoriesRequiringReadme = documentationDirectories.filter(
  (directory) => directFiles(directory).length > 2,
);

const requiredReadmeSections = [
  { label: 'Contents', headings: ['Contents'] },
  { label: 'Ownership', headings: ['Ownership'] },
  { label: 'Extension', headings: ['Extension', 'Extension rules'] },
  {
    label: 'Conventions',
    headings: ['Conventions', 'Conventions and related material'],
  },
  {
    label: 'Related links',
    headings: ['Related links', 'Conventions and related material'],
  },
] as const;

const sectionBody = (contents: string, heading: string): string | undefined => {
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const match = new RegExp(
    `^##\\s+${escapedHeading}\\s*$([\\s\\S]*?)(?=^##\\s+|(?![\\s\\S]))`,
    'imu',
  ).exec(contents);
  return match?.[1].trim();
};

const configurationFiles = [
  join(repositoryRoot, 'package.json'),
  join(repositoryRoot, 'tsconfig.base.json'),
  ...documentationDirectories.flatMap((directory) => directFiles(directory)),
].filter((path, index, paths) => {
  if (paths.indexOf(path) !== index) {
    return false;
  }

  const basename = path.split('/').at(-1) ?? '';
  return (
    basename === 'package.json' ||
    /^tsconfig(?:\..+)?\.json$/u.test(basename) ||
    /^astro\.config\./u.test(basename) ||
    /^\.env(?:\..*)?$/u.test(basename) ||
    /^\.dev\.vars(?:\..*)?$/u.test(basename) ||
    basename === 'wrangler.jsonc' ||
    /^.+\.config\.ts$/u.test(basename)
  );
});

const namedAstroFiles = documentationDirectories
  .flatMap((directory) => directFiles(directory))
  .filter((path) => path.endsWith('.astro'));

describe('directory documentation boundaries', () => {
  it('documents every non-generated directory with more than two direct files', () => {
    expect(directoriesRequiringReadme.length).toBeGreaterThan(0);

    for (const directory of directoriesRequiringReadme) {
      const readmePath = join(directory, 'README.md');
      expect(
        statSync(readmePath).isFile(),
        relative(repositoryRoot, readmePath),
      ).toBe(true);

      const contents = readText(readmePath);
      for (const section of requiredReadmeSections) {
        const body = section.headings
          .map((heading) => sectionBody(contents, heading))
          .find((candidate) => candidate !== undefined);
        expect(
          body,
          `${relative(repositoryRoot, readmePath)}: ${section.label}`,
        ).toBeTruthy();
      }
    }
  });

  it('replaces the Astro starter README with project-owned guidance', () => {
    const docsReadme = readText(join(repositoryRoot, 'apps/docs/README.md'));

    expect(docsReadme).not.toContain('Astro Starter Kit');
    expect(docsReadme).not.toContain('Seasoned astronaut');
    expect(docsReadme).toContain('local bootstrap');
    expect(docsReadme).toContain('Cloudflare Workers Paid');
  });

  it('documents an exact local bootstrap without unresolved instruction markers', () => {
    const bootstrap = readText(join(repositoryRoot, 'docs/local-bootstrap.md'));

    for (const command of [
      'node --version',
      'pnpm --version',
      'pnpm install --frozen-lockfile',
      'pnpm validate',
    ]) {
      expect(bootstrap).toContain(command);
    }

    expect(bootstrap).toMatch(/^##\s+Expected output$/imu);
    expect(bootstrap).toMatch(/^##\s+Troubleshooting$/imu);
    expect(bootstrap).toMatch(/^##\s+Cost and provider boundary$/imu);
    expect(bootstrap).not.toMatch(/\{\{|\}\}|TODO|FIXME|<[^>]+>/u);
  });
});

describe('named configuration boundaries', () => {
  it('keeps protected package, TypeScript, Astro, and environment config bounded', () => {
    expect(configurationFiles.length).toBeGreaterThan(0);

    for (const path of configurationFiles) {
      expect(
        lineCount(path),
        relative(repositoryRoot, path),
      ).toBeLessThanOrEqual(100);
    }

    for (const path of namedAstroFiles) {
      expect(
        lineCount(path),
        relative(repositoryRoot, path),
      ).toBeLessThanOrEqual(200);
    }
  });

  it('keeps the explicitly protected root package and TypeScript configs present', () => {
    for (const path of [
      join(repositoryRoot, 'package.json'),
      join(repositoryRoot, 'tsconfig.base.json'),
    ]) {
      expect(statSync(path).isFile(), relative(repositoryRoot, path)).toBe(
        true,
      );
    }
  });
});
