export const AC265_HOSTED_SCOPE_FAILURE =
  'AC265 hosted staging-scope verification failed';

export const failAc265HostedVerification = (): never => {
  throw new Error(AC265_HOSTED_SCOPE_FAILURE);
};
