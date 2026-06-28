'use client'

import { useEffect, useRef, forwardRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, autoResize = false, onChange, ...props }, forwardedRef) => {
    const innerRef = useRef<HTMLTextAreaElement>(null)

    const ref = (forwardedRef as React.RefObject<HTMLTextAreaElement>) ?? innerRef

    function resize(el: HTMLTextAreaElement) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }

    useEffect(() => {
      if (autoResize && ref && 'current' in ref && ref.current) {
        resize(ref.current)
      }
    })

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      if (autoResize) resize(e.target)
      onChange?.(e)
    }

    return (
      <textarea
        ref={ref}
        className={cn(
          'flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground',
          'resize-none outline-none transition-colors',
          'focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20',
          className,
        )}
        onChange={handleChange}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export { Textarea }
