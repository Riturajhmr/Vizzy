import { cn } from '@/lib/utils'
import type { ComponentProps } from 'react'

interface ScrollAreaProps extends ComponentProps<'div'> {
  className?: string
}

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div
      className={cn('relative overflow-y-auto scrollbar-thin', className)}
      {...props}
    >
      {children}
    </div>
  )
}
