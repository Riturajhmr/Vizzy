import { Avatar } from '@/components/ui/avatar'

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 px-4 py-2">
      <Avatar fallback="V" size="sm" className="bg-primary text-primary-foreground shrink-0" />
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-card px-4 py-3 shadow-xs border border-border">
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </div>
    </div>
  )
}
