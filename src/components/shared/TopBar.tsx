'use client'
import { Search } from 'lucide-react'
import NotificationPanel from './NotificationPanel'
import ThemeToggle from './ThemeToggle'
import type { Profile } from '@/types/database'

export default function TopBar({ profile, title }: { profile: Profile; title: string }) {
  return (
    <header className="hidden lg:flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30">
      <h1 className="text-lg font-bold font-display text-gray-900 dark:text-white">{title}</h1>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <NotificationPanel />
        <div className="flex items-center gap-2 ml-2 pl-3 border-l border-gray-100 dark:border-gray-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-400 flex items-center justify-center text-white text-xs font-bold">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div className="hidden xl:block">
            <p className="text-xs font-semibold text-gray-900 dark:text-white leading-none">{profile.name.split(' ')[0]}</p>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">{profile.org} Volunteer</p>
          </div>
        </div>
      </div>
    </header>
  )
}
