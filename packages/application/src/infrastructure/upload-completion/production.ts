import type {
  UploadCompletionPersistence,
  UploadCompletionPorts,
  UploadCompletionQueuePort,
  UploadCompletionStoragePort,
} from './types.ts';

/** Explicit dependency boundary used until production adapters are composed. */
export class UploadCompletionDependencyError extends Error {
  constructor() {
    super('Upload completion dependency is unavailable.');
    this.name = 'UploadCompletionDependencyError';
  }
}

const unavailableStorage: UploadCompletionStoragePort = {
  observe: async () => {
    throw new UploadCompletionDependencyError();
  },
};

const unavailableQueue: UploadCompletionQueuePort = {
  enqueue: async () => {
    throw new UploadCompletionDependencyError();
  },
};

const unavailablePersistence: UploadCompletionPersistence = {
  cancelCompletion: async () => {
    throw new UploadCompletionDependencyError();
  },
  claimVerification: async () => {
    throw new UploadCompletionDependencyError();
  },
  commitCompletion: async () => {
    throw new UploadCompletionDependencyError();
  },
  finishVerification: async () => {
    throw new UploadCompletionDependencyError();
  },
  readIntent: async () => {
    throw new UploadCompletionDependencyError();
  },
  readObject: async () => {
    throw new UploadCompletionDependencyError();
  },
  readVerificationTarget: async () => {
    throw new UploadCompletionDependencyError();
  },
};

const unavailableAuthorization = {
  authorize: async () => {
    throw new UploadCompletionDependencyError();
  },
};

const unavailableDigest = {
  digest: async () => {
    throw new UploadCompletionDependencyError();
  },
};

export const createProductionUploadCompletionPorts = (
  overrides: Partial<UploadCompletionPorts> = {},
): UploadCompletionPorts => ({
  authorization: overrides.authorization ?? unavailableAuthorization,
  digest: overrides.digest ?? unavailableDigest,
  persistence: overrides.persistence ?? unavailablePersistence,
  queue: overrides.queue ?? unavailableQueue,
  storage: overrides.storage ?? unavailableStorage,
});
