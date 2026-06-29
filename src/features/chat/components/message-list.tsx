'use client'

import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import type { Message } from '@/types/plugin'

interface MessageListProps {
  messages: Message[]
  isPending: boolean
}

export function MessageList({ messages, isPending }: MessageListProps) {
  const ref = useScrollToBottom<HTMLDivElement>([messages, isPending])

  return (
    <div
      ref={ref}
      role="log"
      aria-live="polite"
      aria-label="Conversation"
      className="flex flex-1 flex-col overflow-y-auto scrollbar-thin py-4"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isPending && <TypingIndicator />}
      <div aria-hidden="true" />
    </div>
  )
}
