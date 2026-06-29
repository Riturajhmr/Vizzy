import type { Intent, WorkflowContext, WorkflowResult } from '@/types'
import { resolve } from '@/workflows/registry'

function buildFallbackResult(intent: Intent): WorkflowResult {
  return {
    type: 'fallback',
    status: 'error',
    payload: {
      message: `No workflow could handle "${intent.type}". Please try rephrasing your request.`,
    },
    metadata: {
      pluginId: 'system',
      executedAt: new Date().toISOString(),
    },
  }
}

export async function route(
  intent: Intent,
  context: WorkflowContext,
): Promise<WorkflowResult> {
  const plugin = resolve(intent)

  if (!plugin) {
    return buildFallbackResult(intent)
  }

  let result: WorkflowResult
  try {
    result = await plugin.execute(context)
  } catch (err) {
    console.error(`[WorkflowRouter] Plugin "${plugin.id}" threw during execution:`, err)
    return buildFallbackResult(intent)
  }

  if (!plugin.validate(result)) {
    return buildFallbackResult(intent)
  }

  return result
}
