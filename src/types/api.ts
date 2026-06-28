export type ApiResponse<T> = {
  data: T | null
  error: string | null
  meta?: Record<string, unknown>
}

export function successResponse<T>(data: T, meta?: Record<string, unknown>): ApiResponse<T> {
  return { data, error: null, ...(meta !== undefined ? { meta } : {}) }
}

export function errorResponse(error: string): ApiResponse<never> {
  return { data: null, error }
}
