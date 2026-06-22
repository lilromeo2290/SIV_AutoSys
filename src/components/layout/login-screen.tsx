'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAppStore, DEMO_USERS, ROLE_LABELS, ROLE_COLORS, ROLE_ICONS, type UserProfile } from '@/store/app-store'
import { Wrench, ArrowRight } from 'lucide-react'

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getRoleBadgeClass(role: UserProfile['role']): string {
  return ROLE_COLORS[role]
}

export function LoginScreen() {
  const login = useAppStore(s => s.login)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Wrench className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">OpsManager</h1>
            <p className="text-muted-foreground mt-1">Internal Management System</p>
          </div>
          <p className="text-sm text-muted-foreground">
            Select your profile to sign in
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_USERS.map((user) => (
            <Card
              key={user.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/50 hover:scale-[1.02] ${
                hoveredId === user.id ? 'border-primary/50 shadow-lg scale-[1.02]' : ''
              }`}
              onMouseEnter={() => setHoveredId(user.id)}
              onMouseLeave={() => setHoveredId(null)}
              onClick={() => login(user)}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Avatar className="h-11 w-11 ring-2 ring-muted">
                    <AvatarFallback className="text-sm font-semibold bg-muted">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm leading-none truncate">
                        {user.name}
                      </h3>
                      <span className="text-lg" title={ROLE_LABELS[user.role]}>
                        {ROLE_ICONS[user.role]}
                      </span>
                    </div>
                    <Badge variant="secondary" className={`text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                      {ROLE_LABELS[user.role]}
                    </Badge>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                {hoveredId === user.id && (
                  <div className="absolute bottom-3 right-3">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Permission Overview */}
        <Card className="bg-muted/30">
          <CardContent className="p-5">
            <h3 className="text-sm font-semibold mb-3">Access Overview by Role</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
              {([
                { role: 'ADMIN' as const, label: 'Admin', modules: 'Full access' },
                { role: 'MANAGER' as const, label: 'Manager', modules: 'All except Inventory' },
                { role: 'SERVICE_ADVISOR' as const, label: 'Advisor', modules: 'Customers, Jobs, Billing' },
                { role: 'CASHIER' as const, label: 'Cashier', modules: 'Customers, Billing' },
                { role: 'STOREKEEPER' as const, label: 'Storekeeper', modules: 'Inventory, Workshop' },
                { role: 'TECHNICIAN' as const, label: 'Technician', modules: 'Workshop, Jobs (view)' },
              ]).map((item) => (
                <div key={item.role} className="space-y-1">
                  <Badge variant="outline" className={`text-xs font-medium w-full justify-center ${getRoleBadgeClass(item.role)}`}>
                    {ROLE_ICONS[item.role]} {item.label}
                  </Badge>
                  <p className="text-muted-foreground text-center">{item.modules}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
