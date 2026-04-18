'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { LayoutDashboard, CalendarDays, Users, CheckSquare, LogOut, ChevronLeft, ChevronRight, Menu, X, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import type { Profile } from '@/types/database'
import { APP_NAME } from '@/lib/constants'

const adminNavItems = [
  { href: '/admin', label: 'Admin Overview', icon: LayoutDashboard },
  { href: '/admin/events', label: 'Manage Events', icon: CalendarDays },
  { href: '/admin/students', label: 'Student Database', icon: Users },
  { href: '/admin/attendance', label: 'Attendance', icon: CheckSquare },
]

export default function AdminSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin-login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Logo */}
      <div className={cn('px-4 py-6 flex items-center gap-3 border-b border-gray-800', collapsed && 'justify-center px-2')}>
        <div className="w-8 h-8 rounded-xl bg-white text-gray-900 flex items-center justify-center font-bold">
          <Shield className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm tracking-wide truncate">{APP_NAME}</span>
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Admin Portal</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
        {adminNavItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                collapsed && 'justify-center px-2',
                active
                  ? 'bg-red-500 text-white shadow-nss'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white hover:pl-4 focus-visible:bg-gray-800'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', active ? 'text-white' : '')} />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t border-gray-800 space-y-2">
        {!collapsed && (
          <div className="px-3 pb-2 pt-1 border-b border-gray-800/50 mb-2">
            <p className="text-xs font-semibold text-white truncate">{profile.name}</p>
            <p className="text-[10px] text-gray-400 truncate">{profile.email}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-red-400 hover:bg-gray-800 transition-all duration-200 font-semibold',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign out directly</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration: 0.25, type: 'spring', bounce: 0, ease: 'easeInOut' }}
        className="hidden lg:flex flex-col bg-gray-900 border-r border-gray-800 relative flex-shrink-0 h-screen sticky top-0 shadow-2xl z-20"
      >
        <SidebarContent />
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-24 w-6 h-6 bg-gray-800 border-2 border-gray-900 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors shadow-lg z-30"
        >
          {collapsed ? <ChevronRight className="h-3 w-3 ml-0.5" /> : <ChevronLeft className="h-3 w-3 mr-0.5" />}
        </button>
      </motion.aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 z-40 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white text-gray-900 flex items-center justify-center font-bold">
            <Shield className="h-3 w-3" />
          </div>
          <span className="font-bold text-sm tracking-wide">Admin Portal</span>
        </div>
        <button onClick={() => setMobileOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-800">
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', bounce: 0, duration: 0.4 }} className="absolute left-0 top-0 bottom-0 w-[280px] bg-gray-900 shadow-2xl">
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl bg-gray-800 text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </motion.div>
        </div>
      )}
    </>
  )
}
