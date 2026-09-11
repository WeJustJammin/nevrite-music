import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const GITHUB_ID = /^[1-9][0-9]{0,31}$/u;

const fail = (): never => {
  throw new Error('AC209 exercise marker derivation failed');
};

export const deriveAc209ExerciseMarker = (
  repositoryId: string,
  runId: string,
): string => {
  if (!GITHUB_ID.test(repositoryId) || !GITHUB_ID.test(runId)) fail();
  const hexadecimal = createHash('sha256')
    .update(`wejammin/ac209/v1\0${repositoryId}\0${runId}`)
    .digest('hex')
    .slice(0, 32)
    .split('');
  hexadecimal[12] = '4';
  hexadecimal[16] = ['8', '9', 'a', 'b'][
    Number.parseInt(hexadecimal[16] ?? '0', 16) % 4
  ];
  const compact = hexadecimal.join('');
  return [
    compact.slice(0, 8),
    compact.slice(8, 12),
    compact.slice(12, 16),
    compact.slice(16, 20),
    compact.slice(20),
  ].join('-');
};

const entrypoint = process.argv[1];
if (entrypoint && resolve(entrypoint) === fileURLToPath(import.meta.url)) {
  try {
    process.stdout.write(
      deriveAc209ExerciseMarker(
        process.env['AC209_MARKER_REPOSITORY_ID'] ?? '',
        process.env['AC209_MARKER_RUN_ID'] ?? '',
      ),
    );
  } catch {
    console.error('::error::AC209 exercise marker derivation failed');
    process.exitCode = 1;
  }
}
