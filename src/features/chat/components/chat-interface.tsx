'use client'

import { useMessages } from '../hooks/use-messages'
import { EmptyChatState } from './empty-chat-state'
import { MessageList } from './message-list'
import { ChatInput } from './chat-input'
import { Button } from '@/components/ui/button'

export function ChatInterface() {
  const { messages, streamingState, sendMessage, cancelStreaming, retryLastMessage } = useMessages()
  const isLoading = streamingState === 'pending' || streamingState === 'streaming'
  const isPending = streamingState === 'pending'
  const isError = streamingState === 'error'
  const hasMessages = messages.length > 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {hasMessages ? (
        <MessageList messages={messages} isPending={isPending} />
      ) : (
        <EmptyChatState onSelectPrompt={sendMessage} />
      )}

      {isError && (
        <div className="flex items-center justify-center gap-3 border-t border-destructive/20 bg-destructive/5 px-4 py-2">
          <p className="text-sm text-destructive">Something went wrong. Please try again.</p>
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs"
            onClick={() => void retryLastMessage()}
          >
            Retry
          </Button>
        </div>
      )}

      <div className="shrink-0 border-t border-border bg-background px-4 py-4">
        <div className="mx-auto w-full max-w-2xl">
          <ChatInput
            onSubmit={sendMessage}
            isLoading={isLoading}
            {...(isLoading ? { onCancel: cancelStreaming } : {})}
          />
          <p className="mt-2 text-center text-[11px] text-muted-foreground">
            Vizzy routes your intent to the right creative workflow automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
