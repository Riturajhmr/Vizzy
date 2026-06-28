// Retry helper for transient AI provider failures.
// Use only for network timeouts and rate limit (429) errors.
// Do NOT retry on 400/401/403 — those are not transient.
const TRANSIENT_STATUS_CODES = new Set([429, 503, 504])

function isTransientError(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as { status: unknown }).status === 'number'
  ) {
    return TRANSIENT_STATUS_CODES.has((error as { status: number }).status)
  }
  return false
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      if (attempt === maxAttempts || !isTransientError(error)) throw error
      await wait(attempt * 500)
    }
  }
  throw new Error('Max retry attempts exceeded')
}
