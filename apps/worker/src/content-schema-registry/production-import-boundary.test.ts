import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const workerSource = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const readSource = (relativePath: string): string =>
  readFileSync(resolve(workerSource, relativePath), 'utf8');

describe('Worker production import boundaries', () => {
  it('keeps content-registry production leaves off root composition', () => {
    for (const relativePath of [
      'authentication/boundary.ts',
      'authentication/production-configuration.ts',
      'authentication/types.ts',
      'content-schema-registry/production-types.ts',
    ]) {
      expect(readSource(relativePath), relativePath).not.toMatch(
        /from\s+['"](?:\.\.\/)?index['"]/u,
      );
    }
  });

  it('re-exports the leaf binding type through the public worker entrypoint', () => {
    expect(readSource('index.ts')).toContain('export type { WorkerBindings };');
  });
});
