import type { WorkflowContext, WorkflowResult } from '@/types'

export async function execute(context: WorkflowContext): Promise<WorkflowResult> {
  return {
    type: 'conversation',
    status: 'success',
    payload: { message: context.intent.description },
    metadata: {
      pluginId: 'conversation',
      executedAt: new Date().toISOString(),
    },
  }
}
