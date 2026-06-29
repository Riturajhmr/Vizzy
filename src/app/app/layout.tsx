import type { Metadata } from 'next'
import { ChatShell } from '@/features/chat/components/chat-shell'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'

export const metadata: Metadata = {
  title: 'Chat',
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ChatShell>
      <div className="flex h-dvh overflow-hidden bg-background">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppHeader />
          <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
        </div>
      </div>
    </ChatShell>
  )
}
