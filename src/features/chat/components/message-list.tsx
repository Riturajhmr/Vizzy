'use client'

import { useScrollToBottom } from '@/hooks/use-scroll-to-bottom'
import { MessageBubble } from './message-bubble'
import { TypingIndicator } from './typing-indicator'
import type { Message } from '@/types/plugin'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const ref = useScrollToBottom<HTMLDivElement>([messages, isLoading])

  return (
    <div ref={ref} className="flex flex-1 flex-col overflow-y-auto scrollbar-thin py-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <TypingIndicator />}
      {/* Scroll anchor */}
      <div aria-hidden="true" />
    </div>
  )
}
