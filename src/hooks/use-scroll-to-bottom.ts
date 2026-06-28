'use client'

import { useEffect, useRef } from 'react'

export function useScrollToBottom<T extends HTMLElement>(deps: unknown[]) {
  const ref = useRef<T>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
