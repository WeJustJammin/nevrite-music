export class ActingContextRequestError extends Error {
  constructor(
    message: string,
    readonly requiresReconciliation = false,
  ) {
    super(message);
    this.name = 'ActingContextRequestError';
  }
}
