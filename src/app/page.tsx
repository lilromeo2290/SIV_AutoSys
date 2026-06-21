'use client'

import React, { useEffect, useState } from 'react'
import { useAppStore, type ModulePage } from '@/store/app-store'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarTrigger, SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
  Menu,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { DashboardPage } from '@/components/modules/dashboard-page'
import { CustomersPage } from '@/components/modules/customers-page'
import { JobCardsPage } from '@/components/modules/job-cards-page'
import { WorkshopPage } from '@/components/modules/workshop-page'
import { InventoryPage } from '@/components/modules/inventory-page'
import { BillingPage } from '@/components/modules/billing-page'
import { RemindersPage } from '@/components/modules/reminders-page'
import { ReportsPage } from '@/components/modules/reports-page'

const navItems: { id: ModulePage; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'job-cards', label: 'Job Cards', icon: ClipboardList },
  { id: 'workshop', label: 'Workshop', icon: Wrench },
  { id: 'inventory', label: 'Inventory', icon: Package },
  { id: 'billing', label: 'Billing', icon: Receipt },
  { id: 'reminders', label: 'Reminders', icon: Bell },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
]

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
    default: return <DashboardPage />
  }
}

export default function Home() {
  const { activePage, setActivePage } = useAppStore()

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
                {navItems.map((item) => (
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
          <div className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs font-semibold">JA</AvatarFallback>
            </Avatar>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-medium leading-none">John Admin</p>
              <p className="text-xs text-muted-foreground mt-0.5">Administrator</p>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
          <div className="flex-1">
            <h2 className="text-lg font-semibold capitalize">
              {activePage.replace('-', ' ')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
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
