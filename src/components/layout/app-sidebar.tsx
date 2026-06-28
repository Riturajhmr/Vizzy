'use client'

import { Plus, Moon, Sun, Monitor, Settings, MessageSquare } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { useUIStore } from '@/store/ui'
import { cn } from '@/lib/utils'

const DEMO_CONVERSATIONS = [
  { id: '1', title: 'Sunset poster design', time: '2h ago' },
  { id: '2', title: 'Brand logo concept', time: 'Yesterday' },
  { id: '3', title: 'Story about a lost city', time: '3 days ago' },
]

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const next: Record<string, string> = { light: 'dark', dark: 'system', system: 'light' }
  const icon =
    theme === 'light' ? <Sun className="size-4" /> :
    theme === 'dark' ? <Moon className="size-4" /> :
    <Monitor className="size-4" />

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(next[theme ?? 'system'] ?? 'system')}
      aria-label={`Theme: ${theme ?? 'system'}`}
    >
      {icon}
    </Button>
  )
}

export function AppSidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-background/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-sidebar transition-transform duration-200 ease-in-out',
          'lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Vizzy
            </span>
          </div>
        </div>

        <Separator />

        {/* New chat */}
        <div className="px-3 pt-3">
          <Button variant="outline" size="sm" className="w-full justify-start gap-2">
            <Plus className="size-4" />
            New chat
          </Button>
        </div>

        {/* Conversation list */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3" aria-label="Conversations">
          <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Recent
          </p>
          {DEMO_CONVERSATIONS.map((c) => (
            <button
              key={c.id}
              className={cn(
                'group flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors',
                'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
              )}
            >
              <span className="flex items-center gap-2 truncate text-sm font-medium text-sidebar-foreground">
                <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">{c.title}</span>
              </span>
              <span className="ml-[22px] text-[11px] text-muted-foreground">{c.time}</span>
            </button>
          ))}

          {/* Skeleton loading placeholder */}
          <div className="mt-2 space-y-1.5 px-2" aria-hidden="true">
            <Skeleton className="h-8 w-full opacity-40" />
            <Skeleton className="h-8 w-4/5 opacity-30" />
          </div>
        </nav>

        <Separator />

        {/* Bottom actions */}
        <div className="flex items-center justify-between px-3 py-3">
          <ThemeToggle />
          <Button variant="ghost" size="icon-sm" aria-label="Settings" disabled>
            <Settings className="size-4" />
          </Button>
        </div>
      </aside>
    </>
  )
}
