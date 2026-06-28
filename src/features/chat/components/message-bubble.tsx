import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/avatar'
import type { Message } from '@/types/plugin'

interface MessageBubbleProps {
  message: Message
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn('flex items-end gap-3 px-4 py-1', isUser ? 'flex-row-reverse' : 'flex-row')}
      data-role={message.role}
    >
      {!isUser && (
        <Avatar
          fallback="V"
          size="sm"
          className="shrink-0 bg-primary text-primary-foreground"
          aria-label="Vizzy"
        />
      )}

      <div className={cn('flex max-w-[75%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-xs',
            isUser
              ? 'rounded-br-sm bg-primary text-primary-foreground'
              : 'rounded-bl-sm bg-card text-card-foreground border border-border',
          )}
        >
          {message.content}
        </div>
        <time
          className="text-[11px] text-muted-foreground px-1"
          dateTime={message.createdAt}
          aria-label={formatTime(message.createdAt)}
        >
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  )
}
