import { ClientBindingIdSchema } from '@wejammin/contracts';
import type { AuthenticationResult } from './types';

export const parseClientBindingIdHeader = (
  request: Request,
): AuthenticationResult<string | null> => {
  const value = request.headers.get('x-client-binding-id');
  if (value === null) return { ok: true, value: null };
  const parsed = ClientBindingIdSchema.safeParse(value);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    status: 400,
    code: 'INVALID_REQUEST',
    message: 'The client-binding selector is invalid.',
    details: {
      violations: [
        {
          path: '/headers/x-client-binding-id',
          code: 'binding_id_invalid',
          message: 'The value is invalid.',
        },
      ],
    },
  };
};
