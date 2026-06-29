'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Moon, Sun, Monitor, Settings, MessageSquare, Pencil, Trash2 } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useUIStore } from '@/store/ui'
import { useConversations } from '@/features/chat/hooks/use-conversations'
import { cn } from '@/lib/utils'
import type { Conversation } from '@/types/conversation'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

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

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
  onRename: (title: string) => void
}

function ConversationItem({ conversation, isActive, onSelect, onDelete, onRename }: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draftTitle, setDraftTitle] = useState(conversation.title)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) inputRef.current?.select()
  }, [isEditing])

  function startEditing() {
    setDraftTitle(conversation.title)
    setIsEditing(true)
  }

  function commitRename() {
    const trimmed = draftTitle.trim()
    if (trimmed && trimmed !== conversation.title) {
      onRename(trimmed)
    }
    setIsEditing(false)
  }

  function cancelRename() {
    setDraftTitle(conversation.title)
    setIsEditing(false)
  }

  return (
    <div
      className={cn(
        'group relative flex w-full items-center rounded-lg transition-colors',
        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
      )}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename()
            if (e.key === 'Escape') cancelRename()
          }}
          className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-medium text-sidebar-foreground outline-none"
          aria-label="Rename conversation"
          autoFocus
        />
      ) : (
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            'flex min-w-0 flex-1 flex-col px-3 py-2 text-left',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring',
          )}
        >
          <span className="flex items-center gap-2 truncate text-sm font-medium text-sidebar-foreground">
            <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{conversation.title}</span>
          </span>
          <span className="ml-[22px] text-[11px] text-muted-foreground">
            {formatDate(conversation.createdAt)}
          </span>
        </button>
      )}

      {!isEditing && (
        <div className="flex shrink-0 items-center gap-0.5 pr-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); startEditing() }}
            aria-label="Rename conversation"
            className="size-6"
          >
            <Pencil className="size-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            aria-label="Delete conversation"
            className="size-6 text-destructive hover:text-destructive"
          >
            <Trash2 className="size-3" />
          </Button>
        </div>
      )}
    </div>
  )
}

export function AppSidebar() {
  const { sidebarOpen, setSidebarOpen } = useUIStore()
  const {
    conversations,
    activeConversationId,
    createConversation,
    selectConversation,
    deleteConversation,
    renameConversation,
  } = useConversations()

  function handleSelect(id: string) {
    selectConversation(id)
    setSidebarOpen(false)
  }

  return (
    <>
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
        <div className="flex h-12 shrink-0 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="size-6 rounded-md bg-primary" aria-hidden="true" />
            <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
              Vizzy
            </span>
          </div>
        </div>

        <Separator />

        <div className="px-3 pt-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => createConversation()}
          >
            <Plus className="size-4" />
            New chat
          </Button>
        </div>

        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3"
          aria-label="Conversations"
        >
          {conversations.length > 0 && (
            <p className="mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Recent
            </p>
          )}
          {conversations.map((c) => (
            <ConversationItem
              key={c.id}
              conversation={c}
              isActive={activeConversationId === c.id}
              onSelect={() => handleSelect(c.id)}
              onDelete={() => deleteConversation(c.id)}
              onRename={(title) => renameConversation(c.id, title)}
            />
          ))}
        </nav>

        <Separator />

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
