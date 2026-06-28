'use client'
import { create } from 'zustand'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  theme: Theme
  setTheme: (theme: Theme) => void
  activeModal: string | null
  openModal: (modalId: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  theme: 'system',
  setTheme: (theme) => set({ theme }),

  activeModal: null,
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}))
