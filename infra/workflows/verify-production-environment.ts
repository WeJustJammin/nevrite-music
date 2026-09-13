import { realpathSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

import { verifyProductionEnvironment } from './verify-production-promotion.ts';

type Environment = Readonly<Record<string, string | undefined>>;

export const runProductionEnvironmentVerification = async (
  environment: Environment = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<void> => {
  await verifyProductionEnvironment(
    {
      apiUrl: environment['GITHUB_API_URL'] ?? '',
      confirmProduction: environment['CONFIRM_VERIFICATION'] === 'true',
      ref: environment['GITHUB_REF'] ?? '',
      repository: environment['GITHUB_REPOSITORY'] ?? '',
      sourceSha: environment['SOURCE_SHA'] ?? '',
      token: environment['GITHUB_TOKEN'] ?? '',
    },
    fetchImpl,
  );
};

const entrypoint = process.argv[1];
if (
  entrypoint !== undefined &&
  import.meta.url === pathToFileURL(realpathSync(entrypoint)).href
) {
  try {
    await runProductionEnvironmentVerification();
    console.log('production_environment_preflight=passed');
  } catch (error: unknown) {
    console.error(
      error instanceof Error
        ? error.message
        : 'Production environment preflight failed.',
    );
    process.exitCode = 1;
  }
}
