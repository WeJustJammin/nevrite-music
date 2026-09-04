import { afterEach, describe, expect, it, vi } from 'vitest';

import { humanRequest, makeDependencies } from './routes.coverage.fixtures';

afterEach(() => {
  vi.doUnmock('./domain');
  vi.doUnmock('hono');
  vi.resetModules();
});

describe('content schema registry middleware coverage', () => {
  it('does not overwrite a response request id supplied by an earlier middleware', async () => {
    vi.doMock('./domain', () => ({
      createContentSchemaRegistryDomain: () => ({
        execute: async () => ({ ok: true, value: 'accepted' }),
      }),
    }));
    vi.doMock('hono', async () => {
      const actual = await vi.importActual<typeof import('hono')>('hono');
      const installSeedMiddleware = (
        app: InstanceType<typeof actual.Hono>,
      ): void => {
        const originalUse = app.use.bind(app);
        let seeded = false;
        app.use = ((...useArgs: Parameters<typeof app.use>) => {
          const [path] = useArgs;
          if (!seeded && path === '/api/v1/cms/*') {
            seeded = true;
            const seedHandler = ((
              context: {
                header: (name: string, value: string) => void;
              },
              next: () => Promise<unknown>,
            ) => {
              context.header('x-request-id', 'already-present');
              return next();
            }) as Parameters<typeof app.use>[1];
            originalUse('/api/v1/cms/*', seedHandler);
          }
          return originalUse(...useArgs);
        }) as typeof app.use;
      };
      const Hono = class extends actual.Hono {
        constructor(options?: ConstructorParameters<typeof actual.Hono>[0]) {
          super(options);
          installSeedMiddleware(this);
        }
      };
      return { ...actual, Hono };
    });

    const { createContentSchemaRegistryApp } = await import('./routes');
    const app = createContentSchemaRegistryApp(makeDependencies().dependencies);
    const response = await app.request(
      humanRequest('/api/v1/cms/content-types'),
    );
    expect(response.status).toBe(201);
    expect(response.headers.get('x-request-id')).toBe('already-present');
  });
});
