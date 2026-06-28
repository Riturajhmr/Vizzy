export enum ErrorCode {
  UNKNOWN = 'UNKNOWN',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHORIZATION_DENIED = 'AUTHORIZATION_DENIED',
  NOT_FOUND = 'NOT_FOUND',
  AI_PROVIDER_ERROR = 'AI_PROVIDER_ERROR',
  AI_RATE_LIMIT = 'AI_RATE_LIMIT',
  AI_TIMEOUT = 'AI_TIMEOUT',
  WORKFLOW_NOT_FOUND = 'WORKFLOW_NOT_FOUND',
  WORKFLOW_EXECUTION_FAILED = 'WORKFLOW_EXECUTION_FAILED',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

export class AppError extends Error {
  readonly code: ErrorCode
  readonly statusCode: number
  readonly context: Record<string, unknown>

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    statusCode = 500,
    context: Record<string, unknown> = {}
  ) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.context = context
  }
}

export class ApiError extends AppError {
  constructor(message: string, statusCode: number, code: ErrorCode = ErrorCode.UNKNOWN) {
    super(message, code, statusCode)
    this.name = 'ApiError'
  }
}

export function isAppError(value: unknown): value is AppError {
  return value instanceof AppError
}
