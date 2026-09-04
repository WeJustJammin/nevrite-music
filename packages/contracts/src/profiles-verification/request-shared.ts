import { z } from 'zod';

import {
  CreateCommandHeadersSchema,
  ProtectedCommandHeadersSchema,
} from '../request-command-headers.ts';

export const StrictEmptyProfileBodySchema = z.object({}).strict();

export const profileCommand = <T extends z.ZodTypeAny>(body: T) =>
  z.object({ headers: CreateCommandHeadersSchema, body }).strict();

export const profileProtectedCommand = <T extends z.ZodTypeAny>(body: T) =>
  z.object({ headers: ProtectedCommandHeadersSchema, body }).strict();
