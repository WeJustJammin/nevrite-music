import type {
  ContentSchemaRegistryAc265PrepareRunCommand,
  ContentSchemaRegistryAc265RunnerAuthorization,
  ContentSchemaRegistryAc265VerifiedGithubIdentity,
} from '@wejammin/contracts';

export type Ac265HostedDependencies = Readonly<{
  verifyGithubOidc: (
    token: string,
  ) => Promise<ContentSchemaRegistryAc265VerifiedGithubIdentity>;
  prepareRun: (
    command: ContentSchemaRegistryAc265PrepareRunCommand,
    signal?: AbortSignal,
  ) => Promise<ContentSchemaRegistryAc265RunnerAuthorization>;
}>;

export class Ac265RunConflictError extends Error {
  readonly code = 'AC265_RUN_CONFLICT' as const;

  constructor() {
    super('The AC265 run conflicts with an existing authorization.');
    this.name = 'Ac265RunConflictError';
  }
}
