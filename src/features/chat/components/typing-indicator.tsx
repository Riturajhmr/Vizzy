import { Avatar } from '@/components/ui/avatar'

export function TypingIndicator() {
  return (
    <div role="status" aria-label="Vizzy is typing" className="flex items-end gap-3 px-4 py-2">
      <Avatar fallback="V" size="sm" className="shrink-0 bg-primary text-primary-foreground" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-border bg-card px-4 py-3 shadow-xs">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </div>
    </div>
  )
}
