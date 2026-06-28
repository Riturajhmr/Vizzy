'use client'

import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUIStore } from '@/store/ui'

export function AppHeader() {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)

  return (
    <header className="flex h-12 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
      <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <Menu />
      </Button>
      <span className="text-sm font-semibold tracking-tight text-foreground">Vizzy</span>
    </header>
  )
}
