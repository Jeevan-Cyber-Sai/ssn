'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Users, CalendarDays, ArrowRight, Shield, UserCheck } from 'lucide-react'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, StatCard } from '@/components/ui/index'
import { orgGradient, cn } from '@/lib/utils'
import type { Profile } from '@/types/database'

const stagger = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
}

export default function AdminOverviewClient({ profile, stats, recentRegistrations }: {
  profile: Profile
  stats: { totalStudents: number; totalEvents: number; upcomingEvents: number }
  recentRegistrations: any[]
}) {
  const quickLinks = [
    { href: '/admin/events', icon: CalendarDays, label: 'Manage Events', desc: `Create and edit ${profile.org} events` },
    { href: '/admin/students', icon: Users, label: 'Student Database', desc: `Manage ${profile.org} volunteers` },
    { href: '/admin/attendance', icon: UserCheck, label: 'Mark Attendance', desc: 'Update event attendance records' },
  ]

  const grad = orgGradient(profile.org)

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title={`${profile.org} Admin Dashboard`} />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">

        {/* Admin banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className={cn("relative overflow-hidden rounded-2xl bg-gradient-to-r p-6 text-white", grad)}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20"><Shield className="h-32 w-32" /></div>
            <div className="relative">
              <p className="text-white/80 text-sm mb-1 font-bold tracking-widest uppercase">{profile.org} Administrative Portal</p>
              <h2 className="text-3xl font-extrabold font-display">Welcome, {profile.name.split(' ')[0]} 🛡️</h2>
              <p className="text-white/80 text-sm mt-1">You have full access to manage the {profile.org} ecosystem</p>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div variants={stagger.item}><StatCard label={`Total ${profile.org} Students`} value={stats.totalStudents} icon={<Users className="h-4 w-4" />} color={profile.org.toLowerCase() as any} /></motion.div>
          <motion.div variants={stagger.item}><StatCard label={`Active ${profile.org} Events`} value={stats.totalEvents} icon={<CalendarDays className="h-4 w-4" />} color={profile.org.toLowerCase() as any} /></motion.div>
          <motion.div variants={stagger.item}><StatCard label="Upcoming Events" value={stats.upcomingEvents} icon={<CalendarDays className="h-4 w-4" />} color={profile.org.toLowerCase() as any} /></motion.div>
        </motion.div>

        {/* Quick links */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-bold font-display mb-3">Quick Actions</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {quickLinks.map(({ href, icon: Icon, label, desc }) => (
              <Link key={href} href={href}>
                <Card hover className="p-5 group">
                  <div className={cn("w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 flex items-center justify-center mb-3 transition-colors", profile.org === 'NSS' ? 'group-hover:bg-blue-100 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30' : 'group-hover:bg-red-100 group-hover:text-red-500 dark:group-hover:bg-red-900/30')}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{label}</h4>
                  <p className="text-xs text-gray-500">{desc}</p>
                  <div className={cn("flex items-center gap-1 text-xs mt-3 opacity-0 group-hover:opacity-100 transition-opacity font-bold", profile.org === 'NSS' ? 'text-blue-600' : 'text-red-500')}>
                    Access <ArrowRight className="h-3 w-3" />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent registrations */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-bold font-display mb-3">Recent {profile.org} Registrations</h3>
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
