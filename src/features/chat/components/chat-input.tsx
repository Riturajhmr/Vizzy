'use client'

import { useState, type KeyboardEvent } from 'react'
import { ArrowUp, Square } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ChatInputProps {
  onSubmit: (content: string) => void
  onCancel?: () => void
  isLoading?: boolean
  placeholder?: string
}

export function ChatInput({ onSubmit, onCancel, isLoading = false, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('')

  const canSubmit = value.trim().length > 0 && !isLoading

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (canSubmit) submit()
    }
  }

  function submit() {
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
  }

  return (
    <div className="relative flex items-end gap-2 rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Describe what you want to create…'}
        rows={1}
        autoResize
        aria-label="Chat input"
        className="max-h-40 flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:border-0 focus-visible:ring-0"
      />
      {isLoading && onCancel ? (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={onCancel}
          aria-label="Stop generating"
          className="shrink-0 transition-all"
        >
          <Square className="size-3.5 fill-current" />
        </Button>
      ) : (
        <Button
          size="icon-sm"
          variant={canSubmit ? 'default' : 'ghost'}
          onClick={submit}
          disabled={!canSubmit}
          aria-label="Send message"
          className={cn('shrink-0 transition-all', canSubmit ? 'opacity-100' : 'opacity-40')}
        >
          <ArrowUp />
        </Button>
      )}
    </div>
  )
}
