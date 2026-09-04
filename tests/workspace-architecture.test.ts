import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const rootConfigPath = join(repositoryRoot, 'tsconfig.json');
const sharedConfigPath = join(repositoryRoot, 'tsconfig.base.json');

const workspaceRoots = ['apps', 'packages'] as const;

const packageConfigPaths = workspaceRoots.flatMap((workspaceRoot) => {
  const rootPath = join(repositoryRoot, workspaceRoot);

  return readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(rootPath, entry.name, 'tsconfig.json'))
    .filter((configPath) => existsSync(configPath));
});

const workspacePackages = workspaceRoots.flatMap((workspaceRoot) => {
  const rootPath = join(repositoryRoot, workspaceRoot);

  return readdirSync(rootPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(rootPath, entry.name, 'package.json'))
    .filter((packagePath) => existsSync(packagePath));
});

type JsonObject = Record<string, unknown>;

interface WorkspacePackage {
  readonly manifestPath: string;
  readonly name: string;
  readonly internalDependencies: readonly string[];
}

const readJson = (path: string): JsonObject =>
  JSON.parse(readFileSync(path, 'utf8')) as JsonObject;

const getProjectReferences = (configPath: string): readonly string[] => {
  const config = readJson(configPath);
  const references = config.references;

  if (!Array.isArray(references)) {
    return [];
  }

  return references.flatMap((reference) => {
    if (
      typeof reference !== 'object' ||
      reference === null ||
      !('path' in reference)
    ) {
      return [];
    }

    const referencePath = reference.path;
    return typeof referencePath === 'string' ? [referencePath] : [];
  });
};

const resolveProjectReference = (
  configPath: string,
  referencePath: string,
): string => {
  const resolvedPath = resolve(dirname(configPath), referencePath);
  const directoryConfigPath = join(resolvedPath, 'tsconfig.json');
  return existsSync(directoryConfigPath) ? directoryConfigPath : resolvedPath;
};

const getInternalDependencies = (manifest: JsonObject): readonly string[] => {
  const dependencySections = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
  ];
  const dependencyNames = dependencySections.flatMap((section) => {
    const dependencies = manifest[section];

    return typeof dependencies === 'object' && dependencies !== null
      ? Object.keys(dependencies)
      : [];
  });

  return [
    ...new Set(dependencyNames.filter((name) => name.startsWith('@wejammin/'))),
  ];
};

const loadWorkspacePackages = (): readonly WorkspacePackage[] =>
  workspacePackages.map((manifestPath) => {
    const manifest = readJson(manifestPath);
    const name = manifest.name;

    if (typeof name !== 'string') {
      throw new Error(
        `Workspace package is missing a string name: ${manifestPath}`,
      );
    }

    return {
      manifestPath,
      name,
      internalDependencies: getInternalDependencies(manifest),
    };
  });

const packageConfigPathByName = new Map(
  loadWorkspacePackages().flatMap((workspacePackage) => {
    const configPath = join(
      dirname(workspacePackage.manifestPath),
      'tsconfig.json',
    );
    return existsSync(configPath)
      ? [[workspacePackage.name, configPath] as const]
      : [];
  }),
);

const allowedDependenciesByPackageFamily: Readonly<
  Record<string, readonly string[]>
> = {
  '@wejammin/contracts': [],
  '@wejammin/domain': ['@wejammin/contracts'],
  '@wejammin/application': ['@wejammin/contracts', '@wejammin/domain'],
  '@wejammin/data-access': ['@wejammin/application', '@wejammin/contracts'],
  '@wejammin/integrations': ['@wejammin/application', '@wejammin/contracts'],
  '@wejammin/ui': ['@wejammin/contracts'],
  '@wejammin/config': ['@wejammin/contracts'],
  '@wejammin/observability': ['@wejammin/contracts'],
  '@wejammin/test-support': [
    '@wejammin/application',
    '@wejammin/config',
    '@wejammin/contracts',
    '@wejammin/data-access',
    '@wejammin/domain',
    '@wejammin/integrations',
    '@wejammin/observability',
  ],
  '@wejammin/web': ['@wejammin/contracts', '@wejammin/ui'],
  '@wejammin/docs': ['@wejammin/contracts', '@wejammin/ui'],
  '@wejammin/worker': [
    '@wejammin/application',
    '@wejammin/config',
    '@wejammin/contracts',
    '@wejammin/data-access',
    '@wejammin/domain',
    '@wejammin/integrations',
    '@wejammin/observability',
  ],
};

const getPackageFamily = (packageName: string): string => {
  if (packageName.startsWith('@wejammin/')) {
    const suffix = packageName.slice('@wejammin/'.length);
    const family = suffix.split('/')[0];
    return `@wejammin/${family}`;
  }

  return packageName;
};

const assertDependencyDirection = (
  packages: readonly WorkspacePackage[],
): void => {
  const packageNames = new Set(
    packages.map((workspacePackage) => workspacePackage.name),
  );

  for (const workspacePackage of packages) {
    const family = getPackageFamily(workspacePackage.name);
    const allowedDependencies = allowedDependenciesByPackageFamily[family];

    if (!allowedDependencies) {
      throw new Error(
        `No dependency policy is registered for ${workspacePackage.name}`,
      );
    }

    for (const dependency of workspacePackage.internalDependencies) {
      expect(
        packageNames.has(dependency),
        `${workspacePackage.name} references an unknown workspace package`,
      ).toBe(true);

      expect(
        allowedDependencies.includes(getPackageFamily(dependency)),
        `${workspacePackage.name} must not depend on ${dependency}`,
      ).toBe(true);
    }
  }
};

const findAnyKeywords = (filePath: string): readonly string[] => {
  const source = readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
  );
  const matches: string[] = [];

  const visit = (node: ts.Node): void => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      const position = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      );
      matches.push(`${filePath}:${position.line + 1}`);
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return matches;
};

const typeScriptSourceFiles = workspaceRoots.flatMap((workspaceRoot) => {
  const rootPath = join(repositoryRoot, workspaceRoot);
  const sourceFiles: string[] = [];

  const visit = (directoryPath: string): void => {
    for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
      if (
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'build' ||
        entry.name === '.astro' ||
        entry.name === 'worker-configuration.d.ts'
      ) {
        continue;
      }

      const entryPath = join(directoryPath, entry.name);
      if (entry.isDirectory()) {
        visit(entryPath);
      } else if (/\.tsx?$/.test(entry.name)) {
        sourceFiles.push(entryPath);
      }
    }
  };

  visit(rootPath);
  return sourceFiles;
});

describe('workspace architecture contracts', () => {
  it('uses a strict shared TypeScript baseline with no explicit any types', () => {
    const sharedConfig = readJson(sharedConfigPath);
    const compilerOptions = sharedConfig.compilerOptions;

    expect(compilerOptions).toMatchObject({
      noEmit: true,
      noImplicitAny: true,
      strict: true,
    });

    const anyTypes = typeScriptSourceFiles.flatMap(findAnyKeywords);
    expect(
      anyTypes,
      `Explicit any types found:\n${anyTypes.join('\n')}`,
    ).toEqual([]);
  }, 15_000);

  it('declares every TypeScript project through the root project solution', () => {
    const rootConfig = readJson(rootConfigPath);
    const rootReferences = getProjectReferences(rootConfigPath).map(
      (referencePath) => resolveProjectReference(rootConfigPath, referencePath),
    );

    expect(rootConfig).toMatchObject({
      compilerOptions: { noImplicitAny: true, strict: true },
      files: [],
    });
    expect(rootReferences).toEqual(expect.arrayContaining(packageConfigPaths));
    expect(rootReferences).toHaveLength(packageConfigPaths.length);
  });

  it('emits declaration outputs when composite library packages build', () => {
    const libraryRoot = join(repositoryRoot, 'packages');
    const libraryManifests = workspacePackages.filter(
      (path) => dirname(dirname(path)) === libraryRoot,
    );

    expect(libraryManifests.length).toBeGreaterThan(0);

    for (const manifestPath of libraryManifests) {
      const configPath = join(dirname(manifestPath), 'tsconfig.json');
      expect(
        existsSync(configPath),
        `${relative(repositoryRoot, manifestPath)} must have a TypeScript project config`,
      ).toBe(true);

      const manifest = readJson(manifestPath);
      const config = readJson(configPath);
      const compilerOptions = config.compilerOptions;
      const scripts = manifest.scripts;

      expect(compilerOptions).toMatchObject({
        composite: true,
        declaration: true,
        emitDeclarationOnly: true,
        noEmit: false,
        outDir: 'dist/types',
      });

      expect(
        scripts,
        `${relative(repositoryRoot, manifestPath)} must emit its composite outputs during build`,
      ).toMatchObject({ build: 'tsc --build' });
    }
  });

  it('wires workspace package dependencies to their TypeScript project references', () => {
    const packages = loadWorkspacePackages();

    for (const workspacePackage of packages) {
      const configPath = join(
        dirname(workspacePackage.manifestPath),
        'tsconfig.json',
      );
      if (!existsSync(configPath)) {
        continue;
      }

      const references = getProjectReferences(configPath).map((referencePath) =>
        resolveProjectReference(configPath, referencePath),
      );

      for (const dependency of workspacePackage.internalDependencies) {
        const dependencyConfigPath = packageConfigPathByName.get(dependency);
        if (dependencyConfigPath) {
          expect(
            references,
            `${workspacePackage.name} must reference ${dependency} from ${relative(repositoryRoot, configPath)}`,
          ).toContain(dependencyConfigPath);
        }
      }
    }
  });

  it('rejects a transport or UI package from depending on persistence adapters', () => {
    expect(() =>
      assertDependencyDirection([
        {
          manifestPath: 'fixture/apps/web/package.json',
          name: '@wejammin/web',
          internalDependencies: ['@wejammin/data-access'],
        },
        {
          manifestPath: 'fixture/packages/data-access/package.json',
          name: '@wejammin/data-access',
          internalDependencies: [],
        },
      ]),
    ).toThrow(/must not depend on @wejammin\/data-access/);
  });

  it('accepts the current extraction-safe workspace dependency graph', () => {
    expect(() =>
      assertDependencyDirection(loadWorkspacePackages()),
    ).not.toThrow();
  });
});
