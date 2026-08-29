/** Raised when work is stopped through an AbortSignal */
export class CancelledError extends Error {
  constructor() {
    super('취소됨')
    this.name = 'CancelledError'
  }
}

/**
 * Tells whether an error came from cancellation
 * @param error - The error to inspect
 */
export function isCancelled(error: unknown): boolean {
  return error instanceof CancelledError
}
