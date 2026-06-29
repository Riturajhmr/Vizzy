import type { Message, Asset, WorkflowResult } from './plugin'

export type StreamingState = 'idle' | 'pending' | 'streaming' | 'complete' | 'error'

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export interface ConversationSession {
  conversationId: string
  messages: Message[]
  streamingState: StreamingState
  activeWorkflow: null
  activeOutput: WorkflowResult | null
  selectedAssets: Asset[]
  refinementContext: null
}
