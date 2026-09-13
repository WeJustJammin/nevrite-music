export interface MemoryLockManager {
  readonly manager: LockManager;
  readonly releaseAll: () => void;
}

export const createMemoryLockManager = (
  beforeRequest?: (name: string) => Promise<void>,
): MemoryLockManager => {
  const held = new Set<string>();
  const request = async <T>(
    name: string,
    _options: LockOptions,
    callback: (lock: Lock | null) => T | PromiseLike<T>,
  ): Promise<T> => {
    await beforeRequest?.(name);
    if (held.has(name)) return callback(null);
    held.add(name);
    try {
      return await callback({ name, mode: 'exclusive' } as Lock);
    } finally {
      held.delete(name);
    }
  };
  return {
    manager: { request } as unknown as LockManager,
    releaseAll: () => held.clear(),
  };
};
