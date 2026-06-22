'use client'

import React, { useState } from 'react'
import { useAppStore, DEMO_USERS, ROLE_LABELS, ROLE_ICONS, type UserProfile } from '@/store/app-store'
import { Shield, ArrowRight, Eye, EyeOff } from 'lucide-react'

export function LoginScreen() {
  const login = useAppStore(s => s.login)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const handleCardClick = (user: UserProfile) => {
    setSelectedUser(user)
    setPassword('')
  }

  const handleSubmit = () => {
    if (selectedUser) {
      login(selectedUser)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedUser) {
      handleSubmit()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1410] via-[#2a2118] to-[#1a1410] p-4 relative overflow-hidden">
      {/* Subtle ambient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(180,140,80,0.08)_0%,_transparent_70%)]" />

      <div className="relative z-10 w-full max-w-md space-y-8">
        {/* Branding */}
        <div className="text-center space-y-2">
          <h1
            className="text-4xl font-bold tracking-wide"
            style={{ fontFamily: '"Liberation Serif", "Noto Serif SC", Georgia, serif', color: '#c9a55a' }}
          >
            OpsManager
          </h1>
          <p className="text-xs font-semibold tracking-[0.25em] uppercase" style={{ color: '#8a7a5f' }}>
            Automotive Workshop System
          </p>
          <div className="mx-auto w-48 h-px mt-3" style={{ backgroundColor: 'rgba(180,140,80,0.3)' }} />
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.35)] overflow-hidden">
          {!selectedUser ? (
            /* ── Profile Selection ── */
            <div className="p-6 sm:p-8 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: '#c9a55a' }} />
                  <h2 className="text-lg font-bold text-gray-800">Select Profile</h2>
                </div>
                <p className="text-sm text-gray-500">Choose an account to sign in</p>
              </div>

              <div className="space-y-2">
                {DEMO_USERS.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleCardClick(user)}
                    onMouseEnter={() => setHoveredId(user.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all duration-150 cursor-pointer text-left ${
                      hoveredId === user.id
                        ? 'border-[#c9a55a]/50 bg-[#c9a55a]/5 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0"
                      style={{ background: 'linear-gradient(135deg, #d4a843, #8b6914)' }}
                    >
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{user.name}</p>
                      <p className="text-xs text-gray-400 truncate">{user.email}</p>
                    </div>
                    <span className="text-base shrink-0">{ROLE_ICONS[user.role]}</span>
                    {hoveredId === user.id && (
                      <ArrowRight className="h-4 w-4 shrink-0" style={{ color: '#c9a55a' }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* ── Password / Confirm Screen ── */
            <div className="p-6 sm:p-8 space-y-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: '#c9a55a' }} />
                  <h2 className="text-lg font-bold text-gray-800">Sign In</h2>
                </div>
                <p className="text-sm text-gray-500">
                  Signing in as <span className="font-medium text-gray-700">{selectedUser.name}</span>
                </p>
              </div>

              {/* Selected User Info */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shrink-0"
                  style={{ background: 'linear-gradient(135deg, #d4a843, #8b6914)' }}
                >
                  {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{selectedUser.name}</p>
                  <p className="text-xs" style={{ color: '#8b6914' }}>
                    {ROLE_ICONS[selectedUser.role]} {ROLE_LABELS[selectedUser.role]}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  Change
                </button>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter any password to continue"
                    className="w-full h-11 px-4 pr-11 text-sm rounded-lg border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 outline-none transition-colors focus:border-[#c9a55a] focus:ring-1 focus:ring-[#c9a55a]/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">Demo mode — any password works</p>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-lg text-white text-sm font-semibold transition-all duration-200 cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #d4a843, #8b6914)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #c09838, #7a5c10)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(180,140,80,0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #d4a843, #8b6914)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                Sign In
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs" style={{ color: '#5a4f3f' }}>
          OpsManager — Secure Workshop Management System
        </p>
      </div>
    </div>
  )
}