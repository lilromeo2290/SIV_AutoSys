'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore, type ModulePage } from '@/store/app-store'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Wrench,
  Package,
  Receipt,
  Bell,
  BarChart3,
  Moon,
  Sun,
  LogOut,
  Shield,
  ChevronRight,
  UserCog,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { LoginScreen } from '@/components/layout/login-screen'
import { DashboardPage } from '@/components/modules/dashboard-page'
import { CustomersPage } from '@/components/modules/customers-page'
import { JobCardsPage } from '@/components/modules/job-cards-page'
import { WorkshopPage } from '@/components/modules/workshop-page'
import { InventoryPage } from '@/components/modules/inventory-page'
import { BillingPage } from '@/components/modules/billing-page'
import { RemindersPage } from '@/components/modules/reminders-page'
import { ReportsPage } from '@/components/modules/reports-page'
import { UserRolesPage } from '@/components/modules/user-roles-page'

const allNavItems: { id: ModulePage; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'job-cards', label: 'Job Cards', icon: ClipboardList },
  { id: 'workshop', label: 'Workshop', icon: Wrench },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'user-roles', label: 'User Roles & Staff', icon: UserCog },
]

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!mounted) return <div className="w-9 h-9" />

  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="rounded-md p-2 hover:bg-accent transition-colors"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  )
}

function PageRenderer() {
  const { activePage } = useAppStore()
  switch (activePage) {
    case 'dashboard': return <DashboardPage />
    case 'customers': return <CustomersPage />
    case 'job-cards': return <JobCardsPage />
    case 'workshop': return <WorkshopPage />
    case 'inventory': return <InventoryPage />
    case 'billing': return <BillingPage />
    case 'reminders': return <RemindersPage />
    case 'reports': return <ReportsPage />
    case 'user-roles': return <UserRolesPage />
    default: return <DashboardPage />
  }
}

function AppShell() {
  const { activePage, setActivePage, currentUser, canAccess, logout } = useAppStore()

  // Filter nav items based on role
  const visibleNavItems = allNavItems.filter(item => canAccess(item.id))

  return (
    <SidebarProvider>
      <div className="min-h-screen flex">
        <Sidebar collapsible="icon" className="border-r">
          <SidebarHeader className="px-4 py-4">
            <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shrink-0">
                OM
              </div>
              <div className="group-data-[collapsible=icon]:hidden">
                <h1 className="text-sm font-bold leading-none">OpsManager</h1>
                <p className="text-xs text-muted-foreground mt-0.5">Operations System</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleNavItems.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        isActive={activePage === item.id}
                        onClick={() => setActivePage(item.id)}
                        tooltip={item.label}
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4">
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full group-data-[collapsible=icon]:justify-center hover:bg-accent rounded-lg p-2 -m-2 transition-colors cursor-pointer">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs font-semibold">
                        {getInitials(currentUser.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left group-data-[collapsible=icon]:hidden">
                      <p className="text-sm font-medium leading-none truncate">{currentUser.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {currentUser.role.replace('_', ' ')}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{currentUser.email}</p>
                      <Badge variant="secondary" className="mt-1.5 w-fit text-xs">
                        {currentUser.role.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={logout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold">
                {activePage === 'user-roles' ? 'User Roles & Staff' : activePage.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {currentUser && (
                <Badge variant="outline" className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5">
                  <Shield className="h-3 w-3" />
                  {currentUser.role.replace(/_/g, ' ')}
                </Badge>
              )}
              <ThemeToggle />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            <PageRenderer />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}

export default function Home() {
  const currentUser = useAppStore(s => s.currentUser)

  // Show login screen if not authenticated
  if (!currentUser) {
    return <LoginScreen />
  }

  return <AppShell />
}
