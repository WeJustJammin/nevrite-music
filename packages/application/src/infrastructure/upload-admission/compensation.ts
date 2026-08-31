import type {
  UploadAdmissionError,
  UploadAdmissionUseCaseInput,
  UploadIntentMetadata,
} from './types.ts';
import { error } from './errors.ts';

export const compensate = async (input: {
  signer: UploadAdmissionUseCaseInput['signer'];
  intentId: string;
  objectId: string;
  objectKey: string;
  signedUrl: string;
}): Promise<boolean> => {
  try {
    await input.signer.revoke({
      intentId: input.intentId,
      objectId: input.objectId,
      objectKey: input.objectKey,
      signedUrl: input.signedUrl,
    });
    return true;
  } catch {
    return false;
  }
};

export const failedCommit = async (input: {
  signer: UploadAdmissionUseCaseInput['signer'];
  metadata: UploadIntentMetadata;
  signedUrl: string;
  code?: 'CONFLICT' | 'DEPENDENCY_UNAVAILABLE';
}): Promise<UploadAdmissionError> => {
  const compensated = await compensate({
    objectId: input.metadata.objectId,
    objectKey: input.metadata.objectKey,
    intentId: input.metadata.intentId,
    signedUrl: input.signedUrl,
    signer: input.signer,
  });
  if (!compensated || input.code === 'DEPENDENCY_UNAVAILABLE') {
    return error(
      'DEPENDENCY_UNAVAILABLE',
      503,
      'Upload admission is temporarily unavailable.',
    );
  }
  return error('CONFLICT', 409, 'The upload intent could not be admitted.');
};
