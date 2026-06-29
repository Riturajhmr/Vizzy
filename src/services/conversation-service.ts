import type { Message } from '@/types/plugin'
import type { Conversation, ConversationSession, StreamingState } from '@/types/conversation'

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`
}

function nowISO(): string {
  return new Date().toISOString()
}

export function createConversation(title?: string): Conversation {
  const now = nowISO()
  return {
    id: generateId(),
    title: title ?? 'New conversation',
    createdAt: now,
    updatedAt: now,
  }
}

export function createMessage(role: Message['role'], content: string): Message {
  return {
    id: generateId(),
    role,
    content,
    createdAt: nowISO(),
  }
}

export function createEmptySession(conversationId: string): ConversationSession {
  return {
    conversationId,
    messages: [],
    streamingState: 'idle',
    activeWorkflow: null,
    activeOutput: null,
    selectedAssets: [],
    refinementContext: null,
  }
}

export function addMessageToSession(
  session: ConversationSession,
  message: Message,
): ConversationSession {
  return { ...session, messages: [...session.messages, message] }
}

export function updateMessageInSession(
  session: ConversationSession,
  messageId: string,
  content: string,
): ConversationSession {
  return {
    ...session,
    messages: session.messages.map((m) => (m.id === messageId ? { ...m, content } : m)),
  }
}

export function clearSessionMessages(session: ConversationSession): ConversationSession {
  return { ...session, messages: [], streamingState: 'idle' }
}

export function setSessionStreamingState(
  session: ConversationSession,
  state: StreamingState,
): ConversationSession {
  return { ...session, streamingState: state }
}

export function renameConversation(conversation: Conversation, title: string): Conversation {
  return { ...conversation, title, updatedAt: nowISO() }
}
