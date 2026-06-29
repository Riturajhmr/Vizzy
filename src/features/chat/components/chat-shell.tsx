'use client'

import { LocalStoragePersistence } from '@/services/persistence'
import { ConversationProvider } from '../context/conversation-context'

const persistence = new LocalStoragePersistence()

export function ChatShell({ children }: { children: React.ReactNode }) {
  return <ConversationProvider persistence={persistence}>{children}</ConversationProvider>
}
