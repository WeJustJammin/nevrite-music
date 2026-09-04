import { JobStatusSchema, MergeCaseResourceSchema } from '@wejammin/contracts';

import {
  expectedVersionValue,
  hashRequest,
  invalidPersistenceResponse,
  traceFor,
  type AuthProductionConfiguration,
} from './production-configuration';
import { callRpc, mapProductionFailure } from './production-http';
import { createAccountControlFlow } from './production-login-methods';
import { enabledProvider } from './production-flows';
import type { AuthenticationDependencies } from './types';

export const createAccountMergeDependencies = (
  config: AuthProductionConfiguration,
): Pick<
  AuthenticationDependencies,
  | 'createAccountMerge'
  | 'readAccountMerge'
  | 'startAccountMergeProof'
  | 'confirmAccountMerge'
> => ({
  createAccountMerge: async (input, _env, signal) => {
    try {
      const trace = traceFor(input.request);
      const result = await callRpc(
        config,
        'auth_account_merge_create',
        {
          p_auth_user_id: input.session.authUserId,
          p_session_id: input.session.sessionId,
          p_return_path: input.returnTo,
          p_expected_version: expectedVersionValue(input.ifMatch),
          p_key_hash: await hashRequest(input.idempotencyKey),
          p_request_hash: await hashRequest({
            returnTo: input.returnTo,
            ifMatch: input.ifMatch,
          }),
          p_request_id: trace.requestId,
          p_correlation_id: trace.correlationId,
        },
        signal,
      );
      const parsed = MergeCaseResourceSchema.safeParse(result);
      return parsed.success
        ? { ok: true, value: parsed.data }
        : invalidPersistenceResponse();
    } catch (error) {
      return mapProductionFailure(error);
    }
  },

  readAccountMerge: async (input, _env, signal) => {
    try {
      const trace = traceFor(input.request);
      const result = await callRpc(
        config,
        'auth_account_merge_read',
        {
          p_auth_user_id: input.session.authUserId,
          p_session_id: input.session.sessionId,
          p_merge_id: input.mergeId,
          p_request_id: trace.requestId,
          p_correlation_id: trace.correlationId,
        },
        signal,
      );
      const parsed = MergeCaseResourceSchema.safeParse(result);
      return parsed.success
        ? { ok: true, value: parsed.data }
        : invalidPersistenceResponse();
    } catch (error) {
      return mapProductionFailure(error);
    }
  },

  startAccountMergeProof: async (input, _env, signal) => {
    try {
      const available = await enabledProvider(input.provider, config, signal);
      if (!available.ok) return available;
      const flow = await createAccountControlFlow(
        'auth_account_merge_proof_create',
        input,
        input.request,
        config,
        signal,
      );
      return {
        ok: true,
        value: { resource: flow.resource, cookies: [flow.cookie] },
      };
    } catch (error) {
      return mapProductionFailure(error);
    }
  },

  confirmAccountMerge: async (input, _env, signal) => {
    try {
      const trace = traceFor(input.request);
      const result = await callRpc(
        config,
        'auth_account_merge_confirm',
        {
          p_auth_user_id: input.session.authUserId,
          p_session_id: input.session.sessionId,
          p_merge_id: input.mergeId,
          p_conflict_plan_version: input.conflictPlanVersion,
          p_acknowledgements: input.acknowledgements,
          p_expected_version: expectedVersionValue(input.ifMatch),
          p_key_hash: await hashRequest(input.idempotencyKey),
          p_request_hash: await hashRequest({
            mergeId: input.mergeId,
            conflictPlanVersion: input.conflictPlanVersion,
            acknowledgements: input.acknowledgements,
            ifMatch: input.ifMatch,
          }),
          p_request_id: trace.requestId,
          p_correlation_id: trace.correlationId,
        },
        signal,
      );
      const parsed = JobStatusSchema.safeParse(result);
      return parsed.success
        ? { ok: true, value: parsed.data }
        : invalidPersistenceResponse();
    } catch (error) {
      return mapProductionFailure(error);
    }
  },
});
