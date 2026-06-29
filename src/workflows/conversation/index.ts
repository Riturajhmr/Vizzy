import { register } from '../registry'
import type { WorkflowPlugin } from '@/types'
import { detect } from './detect'
import { execute } from './execute'
import { validate } from './validate'

export const conversationPlugin: WorkflowPlugin = {
  id: 'conversation',
  name: 'Conversation',
  detect,
  execute,
  validate,
}

register(conversationPlugin)
