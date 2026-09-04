import type { ServerEnvironment } from '@wejammin/config/environment';

/** Cloudflare Worker bindings shared by leaf modules without root composition. */
export type WorkerBindings = ServerEnvironment;
