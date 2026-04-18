'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, CalendarDays, ArrowRight, Shield, UserCheck } from 'lucide-react'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, StatCard } from '@/components/ui/index'
import { formatDate } from '@/lib/utils'
import type { Profile } from '@/types/database'

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
}

export default function AdminOverviewClient({ profile, stats, recentRegistrations }: {
  profile: Profile
  stats: { nssStudents: number; yrcStudents: number; nssEvents: number; yrcEvents: number }
  recentRegistrations: any[]
}) {
  const quickLinks = [
    { href: '/admin/events', icon: CalendarDays, label: 'Manage Events', desc: 'Create, edit, delete events for NSS & YRC' },
    { href: '/admin/students', icon: Users, label: 'View Students', desc: 'Browse all registered volunteers' },
    { href: '/admin/attendance', icon: UserCheck, label: 'Mark Attendance', desc: 'Update event attendance status' },
  ]

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title="Admin Panel" />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">

        {/* Admin banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-800 dark:to-gray-900 p-6 text-white">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10"><Shield className="h-24 w-24" /></div>
            <div className="relative">
              <p className="text-white/60 text-sm mb-1">Admin Panel</p>
              <h2 className="text-2xl font-extrabold font-display">Welcome, {profile.name.split(' ')[0]} 🛡️</h2>
              <p className="text-white/60 text-sm mt-1">You have full administrative access to NSS &amp; YRC platform</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={stagger.item}><StatCard label="NSS Students" value={stats.nssStudents} icon={<Users className="h-4 w-4" />} color="nss" /></motion.div>
          <motion.div variants={stagger.item}><StatCard label="YRC Students" value={stats.yrcStudents} icon={<Users className="h-4 w-4" />} color="yrc" /></motion.div>
          <motion.div variants={stagger.item}><StatCard label="NSS Events" value={stats.nssEvents} icon={<CalendarDays className="h-4 w-4" />} color="nss" /></motion.div>
          <motion.div variants={stagger.item}><StatCard label="YRC Events" value={stats.yrcEvents} icon={<CalendarDays className="h-4 w-4" />} color="yrc" /></motion.div>
        </motion.div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-bold font-display mb-3">Quick Actions</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {quickLinks.map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}>
                <Card hover className="p-5 group">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 group-hover:text-red-500 flex items-center justify-center mb-3 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{label}</h4>
                  <p className="text-xs text-gray-500">{desc}</p>
                  <div className="flex items-center gap-1 text-xs text-red-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    Go <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent registrations */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-bold font-display mb-3">Recent Registrations</h3>
          <Card className="overflow-hidden">
            {recentRegistrations.length === 0 ? (
              <p className="text-sm text-gray-400 p-6 text-center">No registrations yet</p>
            ) : (
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentRegistrations.map((reg: any) => (
                  <div key={reg.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{reg.profile?.name}</p>
                      <p className="text-xs text-gray-400">{reg.event?.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={reg.profile?.org === 'NSS' ? 'nss' : 'yrc'}>{reg.profile?.org}</Badge>
                      <Badge variant={reg.status === 'attended' ? 'success' : 'default'}>{reg.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
