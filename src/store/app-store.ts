import { create } from 'zustand'

export type ModulePage = 
  | 'dashboard'
  | 'customers'
  | 'job-cards'
  | 'workshop'
  | 'inventory'
  | 'billing'
  | 'reminders'
  | 'reports'

interface AppState {
  activePage: ModulePage
  sidebarOpen: boolean
  setActivePage: (page: ModulePage) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activePage: 'dashboard',
  sidebarOpen: true,
  setActivePage: (page) => set({ activePage: page }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
