'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, CalendarDays, User, Award, Trophy,
  LogOut, Shield, ChevronLeft, ChevronRight, Menu, X
} from 'lucide-react'
import { cn, orgGradient } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import type { Profile } from '@/types/database'
import { APP_NAME } from '@/lib/constants'
import NotificationPanel from './NotificationPanel'
import ThemeToggle from './ThemeToggle'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/profile', label: 'My Profile', icon: User },
  { href: '/certificates', label: 'Certificates', icon: Award },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
]

export default function Sidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAdmin = profile.role === 'admin'
  const grad = orgGradient(profile.org)

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn('px-4 py-5 flex items-center gap-3', collapsed && 'justify-center px-2')}>
        <div className={cn('w-8 h-8 rounded-xl bg-gradient-to-br flex-shrink-0 flex items-center justify-center text-white text-xs font-bold font-display', grad)}>
          {profile.org}
        </div>
        {!collapsed && (
          <span className="font-bold text-sm font-display text-gray-900 dark:text-white truncate">{APP_NAME}</span>
        )}
      </div>

      {/* Org badge */}
      {!collapsed && (
        <div className="px-4 mb-4">
          <div className={cn('px-3 py-2 rounded-xl bg-gradient-to-r text-white text-xs font-semibold', grad)}>
            {profile.org === 'NSS' ? '🌿 National Service Scheme' : '🩸 Youth Red Cross'}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                collapsed && 'justify-center px-2',
                active
                  ? 'bg-red-500 text-white shadow-nss'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-white' : '')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}

        {isAdmin && (
          <Link
            href="/admin"
            onClick={() => setMobileOpen(false)}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
              collapsed && 'justify-center px-2',
              pathname.startsWith('/admin')
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
            )}
          >
            <Shield className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>Admin Panel</span>}
          </Link>
        )}
      </nav>

      {/* User + logout */}
      <div className="p-2 border-t border-gray-100 dark:border-gray-800 space-y-1">
        {!collapsed && (
          <div className="px-3 py-2">
            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{profile.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{profile.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 relative flex-shrink-0 h-screen sticky top-0"
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shadow-sm z-10"
        >
          {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </motion.aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 z-40">
        <div className="flex items-center gap-2">
          <div className={cn('w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-white text-[10px] font-bold', grad)}>
            {profile.org}
          </div>
          <span className="font-bold text-sm font-display">{APP_NAME}</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationPanel />
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <motion.div
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-xl"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </motion.div>
        </div>
      )}
    </>
  )
}
