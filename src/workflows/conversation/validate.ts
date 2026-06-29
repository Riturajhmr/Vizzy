import type { WorkflowResult } from '@/types'

function isConversationPayload(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as Record<string, unknown>).message === 'string'
  )
}

export function validate(result: WorkflowResult): boolean {
  return (
    result.status === 'success' &&
    result.type === 'conversation' &&
    isConversationPayload(result.payload) &&
    result.payload.message.length > 0
  )
}
