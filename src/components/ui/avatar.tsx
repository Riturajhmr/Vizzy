import { cn } from '@/lib/utils'
import type { HTMLAttributes } from 'react'

interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string
  alt?: string
  fallback?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'size-6 text-xs',
  md: 'size-8 text-sm',
  lg: 'size-10 text-base',
}

export function Avatar({ src, alt, fallback, className, size = 'md', ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-muted font-medium text-muted-foreground overflow-hidden select-none',
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt ?? ''} className="size-full object-cover" />
      ) : (
        <span>{fallback ?? '?'}</span>
      )}
    </span>
  )
}
