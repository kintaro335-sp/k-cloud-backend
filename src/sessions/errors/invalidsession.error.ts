
export class InvalidSessionError extends Error {
  constructor(message: string = "Invalid session") {
    super();
    this.name = 'InvalidSessionError';
    this.message = message;
  }
}

export function isInvalidSessionError(error: unknown): error is InvalidSessionError {
  return error instanceof InvalidSessionError;
}
