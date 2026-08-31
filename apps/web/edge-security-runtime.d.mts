export type EdgeFetchHandler<Env = unknown, ExecutionContext = unknown> = (
  request: Request,
  env: Env,
  context: ExecutionContext,
) => Response | Promise<Response>;

export declare const generateRequestNonce: () => string;
export declare const createContentSecurityPolicy: (nonce: string) => string;
export declare const createSecurityHeaders: (
  nonce: string,
) => Readonly<Record<string, string>>;
export declare const applySecurityHeaders: (
  response: Response,
  nonce?: string,
) => Response;
export declare const shouldRedirectToHttps: (request: Request) => boolean;
export declare const createHttpsRedirectResponse: (
  request: Request,
) => Response;
export declare const withSecurityHeaders: (
  response: Response,
  nonce: string,
) => Promise<Response>;
export declare const createEdgeFetchHandler: <
  Env = unknown,
  ExecutionContext = unknown,
>(
  handler: EdgeFetchHandler<Env, ExecutionContext>,
) => EdgeFetchHandler<Env, ExecutionContext>;
