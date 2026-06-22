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
  | 'user-roles'

export type UserRole = 
  | 'ADMIN'
  | 'MANAGER'
  | 'SERVICE_ADVISOR'
  | 'CASHIER'
  | 'STOREKEEPER'
  | 'TECHNICIAN'

export interface UserProfile {
  id: string
  name: string
  email: string
  phone: string
  role: UserRole
}

// ==================== Permissions Matrix ====================
// Which modules each role can ACCESS (see in sidebar)
const MODULE_ACCESS: Record<UserRole, ModulePage[]> = {
  ADMIN: ['dashboard', 'customers', 'job-cards', 'workshop', 'inventory', 'billing', 'reminders', 'reports', 'user-roles'],
  MANAGER: ['dashboard', 'customers', 'job-cards', 'workshop', 'billing', 'reminders', 'reports', 'user-roles'],
  SERVICE_ADVISOR: ['dashboard', 'customers', 'job-cards', 'workshop', 'billing'],
  CASHIER: ['dashboard', 'customers', 'billing'],
  STOREKEEPER: ['dashboard', 'inventory', 'workshop'],
  TECHNICIAN: ['dashboard', 'workshop', 'job-cards'],
}

// Which modules each role can CREATE in (show add/create buttons)
const MODULE_CREATE: Record<UserRole, ModulePage[]> = {
  ADMIN: ['customers', 'job-cards', 'inventory', 'billing', 'reminders'],
  MANAGER: ['customers', 'job-cards', 'billing', 'reminders'],
  SERVICE_ADVISOR: ['customers', 'job-cards'],
  CASHIER: ['billing'],
  STOREKEEPER: ['inventory'],
  TECHNICIAN: [],
}

// Which modules each role can EDIT in (show edit/delete buttons)
const MODULE_EDIT: Record<UserRole, ModulePage[]> = {
  ADMIN: ['customers', 'job-cards', 'inventory', 'billing', 'reminders'],
  MANAGER: ['customers', 'job-cards', 'billing', 'reminders'],
  SERVICE_ADVISOR: ['customers', 'job-cards'],
  CASHIER: ['billing'],
  STOREKEEPER: ['inventory'],
  TECHNICIAN: [],
}

// Which modules each role can APPROVE/CHANGE STATUS in
const MODULE_APPROVE: Record<UserRole, ModulePage[]> = {
  ADMIN: ['job-cards', 'billing'],
  MANAGER: ['job-cards', 'billing'],
  SERVICE_ADVISOR: [],
  CASHIER: [],
  STOREKEEPER: [],
  TECHNICIAN: [],
}

// Predefined demo users for each role
export const DEMO_USERS: UserProfile[] = [
  { id: '1', name: 'John Admin', email: 'john@ops.com', phone: '555-0100', role: 'ADMIN' },
]

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  SERVICE_ADVISOR: 'Service Advisor',
  CASHIER: 'Cashier',
  STOREKEEPER: 'Storekeeper',
  TECHNICIAN: 'Technician',
}

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  MANAGER: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  SERVICE_ADVISOR: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  CASHIER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  STOREKEEPER: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  TECHNICIAN: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
}

export const ROLE_ICONS: Record<UserRole, string> = {
  ADMIN: '🛡️',
  MANAGER: '👔',
  SERVICE_ADVISOR: '📋',
  CASHIER: '💰',
  STOREKEEPER: '📦',
  TECHNICIAN: '🔧',
}

interface AppState {
  activePage: ModulePage
  currentUser: UserProfile | null
  sidebarOpen: boolean

  setActivePage: (page: ModulePage) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  login: (user: UserProfile) => void
  logout: () => void
  canAccess: (page: ModulePage) => boolean
  canCreate: (page: ModulePage) => boolean
  canEdit: (page: ModulePage) => boolean
  canApprove: (page: ModulePage) => boolean
}

export const useAppStore = create<AppState>((set, get) => ({
  activePage: 'dashboard',
  currentUser: null,
  sidebarOpen: true,

  setActivePage: (page) => {
    const { canAccess } = get()
    if (canAccess(page)) {
      set({ activePage: page })
    }
  },
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  login: (user) => {
    const accessiblePages = MODULE_ACCESS[user.role]
    const firstAccessible = accessiblePages[0] || 'dashboard'
    set({ 
      currentUser: user, 
      activePage: firstAccessible 
    })
  },

  logout: () => set({ currentUser: null, activePage: 'dashboard' }),

  canAccess: (page) => {
    const { currentUser } = get()
    if (!currentUser) return false
    return MODULE_ACCESS[currentUser.role]?.includes(page) ?? false
  },

  canCreate: (page) => {
    const { currentUser } = get()
    if (!currentUser) return false
    return MODULE_CREATE[currentUser.role]?.includes(page) ?? false
  },

  canEdit: (page) => {
    const { currentUser } = get()
    if (!currentUser) return false
    return MODULE_EDIT[currentUser.role]?.includes(page) ?? false
  },

  canApprove: (page) => {
    const { currentUser } = get()
    if (!currentUser) return false
    return MODULE_APPROVE[currentUser.role]?.includes(page) ?? false
  },
}))
