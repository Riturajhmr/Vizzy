import type { Conversation, ConversationSession } from '@/types/conversation'

export interface ConversationStore {
  conversations: Conversation[]
  sessions: Record<string, ConversationSession>
  activeConversationId: string | null
}

export interface ConversationPersistencePort {
  load(): Promise<ConversationStore | null>
  save(store: ConversationStore): Promise<void>
  clear(): Promise<void>
}
