'use client'

import { useChatDemo } from '@/hooks/use-chat-demo'
import { EmptyChatState } from './empty-chat-state'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'

export function ChatInterface() {
  const { messages, isLoading, sendMessage } = useChatDemo()
  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {hasMessages ? (
        <MessageList messages={messages} isLoading={isLoading} />
      ) : (
        <EmptyChatState onSelectPrompt={sendMessage} />
      )}

      <div className="shrink-0 border-t border-border bg-background px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <ChatInput onSubmit={sendMessage} isLoading={isLoading} />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Vizzy routes your intent to the right creative workflow automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
