import {
  createRemoteJWKSet,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTPayload,
} from 'jose';

import {
  AC265_GITHUB_OIDC_AUDIENCE,
  AC265_GITHUB_OIDC_ISSUER,
  AC265_GITHUB_OIDC_REPOSITORY,
  AC265_GITHUB_OIDC_REPOSITORY_ID,
  AC265_GITHUB_OIDC_REPOSITORY_OWNER,
  AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID,
  AC265_GITHUB_OIDC_SUBJECT,
  AC265_GITHUB_OIDC_WORKFLOW_REF,
  AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS,
  ContentSchemaRegistryAc265VerifiedGithubIdentitySchema,
  type ContentSchemaRegistryAc265VerifiedGithubIdentity,
} from '@wejammin/contracts';

const GITHUB_OIDC_JWKS_URL =
  'https://token.actions.githubusercontent.com/.well-known/jwks' as const;
const MAX_TOKEN_LENGTH = 16_384;
const CLOCK_TOLERANCE_SECONDS = 5;
const SHA = /^[0-9a-f]{40}$/u;
const SAFE_IDENTIFIER = /^[\x21-\x7e]{1,256}$/u;
const POSITIVE_GITHUB_ID = /^[1-9][0-9]{0,19}$/u;
const POSITIVE_RUN_ATTEMPT = /^[1-9][0-9]{0,3}$/u;

type GithubOidcPayload = JWTPayload & {
  iss: typeof AC265_GITHUB_OIDC_ISSUER;
  aud: typeof AC265_GITHUB_OIDC_AUDIENCE;
  sub: typeof AC265_GITHUB_OIDC_SUBJECT;
  jti: string;
  iat: number;
  nbf: number;
  exp: number;
  repository: typeof AC265_GITHUB_OIDC_REPOSITORY;
  repository_id: typeof AC265_GITHUB_OIDC_REPOSITORY_ID;
  repository_owner: typeof AC265_GITHUB_OIDC_REPOSITORY_OWNER;
  repository_owner_id: typeof AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID;
  repository_visibility: 'public';
  ref: 'refs/heads/main';
  ref_type: 'branch';
  ref_protected: 'true';
  sha: string;
  event_name: 'workflow_dispatch';
  environment: 'staging';
  runner_environment: 'github-hosted';
  workflow_ref: typeof AC265_GITHUB_OIDC_WORKFLOW_REF;
  workflow_sha: string;
  run_id: string;
  run_attempt: string;
};

export class Ac265GithubOidcError extends Error {
  readonly code = 'OIDC_IDENTITY_REJECTED' as const;

  constructor() {
    super('The protected runner identity could not be verified.');
    this.name = 'Ac265GithubOidcError';
  }
}

export class Ac265GithubOidcDependencyError extends Error {
  readonly code = 'OIDC_DEPENDENCY_UNAVAILABLE' as const;

  constructor() {
    super('The protected runner identity provider is unavailable.');
    this.name = 'Ac265GithubOidcDependencyError';
  }
}

type Ac265GithubOidcVerifierOptions = Readonly<{
  keySet?: JWTVerifyGetKey;
  now?: () => number;
}>;

const fail = (): never => {
  throw new Ac265GithubOidcError();
};

const isPositiveNumericDate = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const parseGithubOidcPayload = (payload: JWTPayload): GithubOidcPayload => {
  if (
    payload.iss !== AC265_GITHUB_OIDC_ISSUER ||
    payload.aud !== AC265_GITHUB_OIDC_AUDIENCE ||
    payload.sub !== AC265_GITHUB_OIDC_SUBJECT ||
    typeof payload.jti !== 'string' ||
    !SAFE_IDENTIFIER.test(payload.jti) ||
    !isPositiveNumericDate(payload.iat) ||
    !isPositiveNumericDate(payload.nbf) ||
    !isPositiveNumericDate(payload.exp) ||
    payload['repository'] !== AC265_GITHUB_OIDC_REPOSITORY ||
    payload['repository_id'] !== AC265_GITHUB_OIDC_REPOSITORY_ID ||
    payload['repository_owner'] !== AC265_GITHUB_OIDC_REPOSITORY_OWNER ||
    payload['repository_owner_id'] !== AC265_GITHUB_OIDC_REPOSITORY_OWNER_ID ||
    payload['repository_visibility'] !== 'public' ||
    payload['ref'] !== 'refs/heads/main' ||
    payload['ref_type'] !== 'branch' ||
    payload['ref_protected'] !== 'true' ||
    typeof payload['sha'] !== 'string' ||
    !SHA.test(payload['sha']) ||
    payload['event_name'] !== 'workflow_dispatch' ||
    payload['environment'] !== 'staging' ||
    payload['runner_environment'] !== 'github-hosted' ||
    payload['workflow_ref'] !== AC265_GITHUB_OIDC_WORKFLOW_REF ||
    typeof payload['workflow_sha'] !== 'string' ||
    !SHA.test(payload['workflow_sha']) ||
    typeof payload['run_id'] !== 'string' ||
    !POSITIVE_GITHUB_ID.test(payload['run_id']) ||
    typeof payload['run_attempt'] !== 'string' ||
    !POSITIVE_RUN_ATTEMPT.test(payload['run_attempt'])
  )
    fail();
  return payload as GithubOidcPayload;
};

const isCompactJwt = (token: string): boolean => {
  if (token.length < 64 || token.length > MAX_TOKEN_LENGTH) return false;
  const segments = token.split('.');
  return (
    segments.length === 3 &&
    segments.every((segment) => /^[A-Za-z0-9_-]+$/u.test(segment))
  );
};

const sha256 = async (value: string): Promise<string> => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

const timestamp = (numericDate: number): string =>
  new Date(numericDate * 1_000).toISOString();

const defaultKeySet = (): JWTVerifyGetKey =>
  createRemoteJWKSet(new URL(GITHUB_OIDC_JWKS_URL), {
    timeoutDuration: 5_000,
    cooldownDuration: 30_000,
    cacheMaxAge: 10 * 60 * 1_000,
  });

const isMissingSigningKey = (error: unknown): boolean => {
  if (typeof error !== 'object' || error === null) return false;
  try {
    return 'code' in error && error.code === 'ERR_JWKS_NO_MATCHING_KEY';
  } catch {
    return false;
  }
};

const protectKeySet =
  (keySet: JWTVerifyGetKey): JWTVerifyGetKey =>
  async (protectedHeader, token) => {
    try {
      return await keySet(protectedHeader, token);
    } catch (error: unknown) {
      if (isMissingSigningKey(error)) throw error;
      throw new Ac265GithubOidcDependencyError();
    }
  };

export const createAc265GithubOidcVerifier = (
  options: Ac265GithubOidcVerifierOptions = {},
) => {
  const keySet = protectKeySet(options.keySet ?? defaultKeySet());
  const now = options.now ?? Date.now;

  return async (
    token: string,
  ): Promise<ContentSchemaRegistryAc265VerifiedGithubIdentity> => {
    try {
      if (!isCompactJwt(token)) fail();
      const currentTime = now();
      if (!Number.isSafeInteger(currentTime) || currentTime <= 0) fail();
      const verified = await jwtVerify(token, keySet, {
        algorithms: ['RS256'],
        audience: AC265_GITHUB_OIDC_AUDIENCE,
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
        currentDate: new Date(currentTime),
        issuer: AC265_GITHUB_OIDC_ISSUER,
        maxTokenAge: '5m',
        requiredClaims: ['aud', 'exp', 'iat', 'iss', 'jti', 'nbf', 'sub'],
        typ: 'JWT',
      });
      if (
        verified.protectedHeader.alg !== 'RS256' ||
        typeof verified.protectedHeader.kid !== 'string' ||
        !SAFE_IDENTIFIER.test(verified.protectedHeader.kid)
      )
        fail();
      const payload = parseGithubOidcPayload(verified.payload);
      const currentSeconds = Math.floor(currentTime / 1_000);
      if (
        payload.sha !== payload.workflow_sha ||
        payload.iat > currentSeconds + CLOCK_TOLERANCE_SECONDS ||
        payload.nbf > payload.iat + CLOCK_TOLERANCE_SECONDS ||
        payload.exp <= payload.iat ||
        (payload.exp - payload.iat) * 1_000 >
          AC265_RUNNER_AUTHORIZATION_MAX_DURATION_MS
      )
        fail();

      return ContentSchemaRegistryAc265VerifiedGithubIdentitySchema.parse({
        issuer: payload.iss,
        audience: payload.aud,
        subject: payload.sub,
        repository: payload.repository,
        repositoryId: payload.repository_id,
        repositoryOwner: payload.repository_owner,
        repositoryOwnerId: payload.repository_owner_id,
        repositoryVisibility: payload.repository_visibility,
        ref: payload.ref,
        refProtected: true,
        eventName: payload.event_name,
        environment: payload.environment,
        runnerEnvironment: payload.runner_environment,
        workflowRef: payload.workflow_ref,
        workflowSha: payload.workflow_sha,
        sha: payload.sha,
        githubRunId: payload.run_id,
        githubRunAttempt: Number(payload.run_attempt),
        jtiSha256: await sha256(payload.jti),
        tokenIssuedAt: timestamp(payload.iat),
        tokenNotBefore: timestamp(payload.nbf),
        tokenExpiresAt: timestamp(payload.exp),
      });
    } catch (error: unknown) {
      if (error instanceof Ac265GithubOidcDependencyError) throw error;
      return fail();
    }
  };
};
