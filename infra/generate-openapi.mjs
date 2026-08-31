import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildOpenApiDocument } from './openapi-document.mjs';

export { buildOpenApiDocument } from './openapi-document.mjs';

const outputUrl = new URL('../docs/openapi/openapi.json', import.meta.url);
const isEntrypoint =
  process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1]);

if (isEntrypoint) {
  const generated = `${JSON.stringify(buildOpenApiDocument(), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    let committed = '';
    try {
      committed = await readFile(outputUrl, 'utf8');
    } catch {
      // Missing output is drift and uses the same failure path as stale output.
    }
    if (committed !== generated) {
      console.error(
        'OpenAPI contract drift detected. Run pnpm contracts:generate.',
      );
      process.exitCode = 1;
    }
  } else {
    await writeFile(outputUrl, generated, 'utf8');
    console.log(`Generated ${fileURLToPath(outputUrl)}`);
  }
}
