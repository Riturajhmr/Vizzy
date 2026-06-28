import type { Intent, WorkflowContext, WorkflowResult } from '@/types'
import { resolve } from '@/workflows/registry'

function buildFallbackResult(_intent: Intent): WorkflowResult {
  return {
    type: 'fallback',
    status: 'error',
    payload: {
      message: 'No workflow matched this intent. Please rephrase your request.',
    },
    metadata: {
      pluginId: 'system',
      executedAt: new Date().toISOString(),
    },
  }
}

export async function route(
  intent: Intent,
  context: WorkflowContext
): Promise<WorkflowResult> {
  const plugin = resolve(intent)

  if (!plugin) {
    return buildFallbackResult(intent)
  }

  const result = await plugin.execute(context)
  const isValid = plugin.validate(result)

  if (!isValid) {
    return buildFallbackResult(intent)
  }

  return result
}
