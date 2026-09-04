export type {
  AuthBootstrapResult,
  AuthCallbackResult,
  AuthenticationDependencies,
  AuthenticationError,
  AuthenticationResult,
  AuthenticationSession,
  AuthRateLimitDecision,
  AuthRateLimitInput,
} from './types';
export { registerAuthenticationRoutes } from './routes';
export { createProductionAuthenticationDependencies } from './production';
export type { AuthProductionOptions } from './production';
