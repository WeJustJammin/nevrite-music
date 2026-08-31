import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const targetPath = resolve(
  repositoryRoot,
  'packages/data-access/src/database.types.ts',
);
const schemas = 'public,platform_private,audit_private,platform_api,public_api';

const generatedTypes = execFileSync(
  'pnpm',
  [
    'exec',
    'supabase',
    'gen',
    'types',
    'typescript',
    '--local',
    '--schema',
    schemas,
  ],
  {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  },
);

const normalize = (value) => `${value.replaceAll('\r\n', '\n').trimEnd()}\n`;
const normalizedGeneratedTypes = normalize(generatedTypes);

if (process.argv.includes('--check')) {
  const committedTypes = normalize(readFileSync(targetPath, 'utf8'));

  if (committedTypes !== normalizedGeneratedTypes) {
    console.error(
      'Generated database types are stale. Start the local database and run `pnpm db:types`.',
    );
    process.exitCode = 1;
  } else {
    console.log('Generated database types match the migrated local schema.');
  }
} else {
  writeFileSync(targetPath, normalizedGeneratedTypes, 'utf8');
  console.log(`Updated ${targetPath}`);
}
