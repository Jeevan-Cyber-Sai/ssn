'use client'
import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import Link from 'next/link'
import { CalendarDays, Clock, Trophy, CheckCircle, ArrowRight, Star } from 'lucide-react'
import { Card, Badge, StatCard } from '@/components/ui/index'
import TopBar from '@/components/shared/TopBar'
import EventCard from '@/components/events/EventCard'
import { formatDate, orgGradient, cn } from '@/lib/utils'
import type { Profile, Event, Registration, LeaderboardEntry } from '@/types/database'

const stagger: { container: Variants; item: Variants } = {
  container: { hidden: {}, show: { transition: { staggerChildren: 0.07 } } },
  item: { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.45,  } } },
}

export default function DashboardClient({ profile, upcomingEvents, recentRegistrations, leaderboard }: {
  profile: Profile
  upcomingEvents: Event[]
  recentRegistrations: Registration[]
  leaderboard: LeaderboardEntry[]
}) {
  const attended = recentRegistrations.filter(r => r.status === 'attended').length
  const registered = recentRegistrations.length
  const grad = orgGradient(profile.org)

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title="Dashboard" />

      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-r text-white p-6', grad)}
        >
          <div className="absolute right-0 top-0 w-48 h-full bg-white/5 rounded-l-full" />
          <div className="relative">
            <p className="text-white/70 text-sm mb-1">Welcome back,</p>
            <h2 className="text-2xl font-extrabold font-display">{profile.name.split(' ')[0]} 👋</h2>
            <p className="text-white/80 text-sm mt-1">{profile.org} Volunteer · Year {profile.year} · {profile.department.split(' ')[0]}</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={stagger.container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div variants={stagger.item}>
            <StatCard label="Events Attended" value={attended} icon={<CheckCircle className="h-4 w-4" />} color="nss" />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard label="Events Registered" value={registered} icon={<CalendarDays className="h-4 w-4" />} />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard label="Volunteer Hours" value={`${profile.total_hours}h`} icon={<Clock className="h-4 w-4" />} color="nss" />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatCard label="Organisation" value={profile.org} icon={<Star className="h-4 w-4" />} />
          </motion.div>
        </motion.div>

        {/* Volunteer Hours Tracker */}
        <motion.div variants={stagger.item} initial="hidden" animate="show" className="mt-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-bold font-display text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-500" />
                  Your Service Journey
                </h3>
                <p className="text-sm text-gray-500">Progress towards your 120-hour certificate goal.</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-extrabold">{profile.total_hours}</span>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400"> / 120 hrs</span>
              </div>
            </div>
            <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-4 relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((profile.total_hours / 120) * 100, 100)}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className={cn('h-full rounded-full', profile.total_hours >= 120 ? 'bg-emerald-500' : 'bg-gradient-to-r from-red-500 to-orange-500')}
              />
              <div className="absolute top-0 right-0 h-full w-[2px] bg-red-800/10 dark:bg-red-200/10" style={{ left: '100%' }} />
            </div>
            {profile.total_hours >= 120 && (
              <p className="text-xs font-bold text-emerald-500 mt-3 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Goal Achieved! You are eligible for certification.
              </p>
            )}
          </Card>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold font-display text-gray-900 dark:text-white">Upcoming Events</h3>
              <Link href="/events" className="text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1">
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            {upcomingEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <CalendarDays className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No upcoming events yet</p>
                <p className="text-xs text-gray-400 mt-1">Check back soon!</p>
              </Card>
            ) : (
              upcomingEvents.map(event => <EventCard key={event.id} event={event} compact registeredIds={recentRegistrations.map(r => r.event_id)} />)
            )}
          </motion.div>

          {/* Leaderboard */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold font-display text-gray-900 dark:text-white">Leaderboard</h3>
              <Link href="/leaderboard" className="text-sm text-red-500 hover:text-red-600 font-semibold flex items-center gap-1">
                Full <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <Card className="p-4 space-y-3">
              {leaderboard.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No data yet</p>
              )}
              {leaderboard.map((entry, i) => {
                const isMe = entry.id === profile.id
                return (
                  <div key={entry.id} className={cn('flex items-center gap-3 p-2.5 rounded-xl transition-colors', isMe && 'bg-red-50 dark:bg-red-900/20')}>
                    <span className={cn('w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                      i === 0 ? 'bg-yellow-100 text-yellow-600' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-600' : 'bg-gray-50 dark:bg-gray-800 text-gray-500'
                    )}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', isMe && 'text-red-600 dark:text-red-400')}>{entry.name}{isMe && ' (You)'}</p>
                      <p className="text-xs text-gray-400 truncate">{entry.department.split(' ')[0]}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.events_attended}</p>
                      <p className="text-[10px] text-gray-400">{entry.total_hours}h</p>
                    </div>
                  </div>
                )
              })}
            </Card>
          </motion.div>
        </div>

        {/* Recent registrations */}
        {recentRegistrations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <h3 className="font-bold font-display text-gray-900 dark:text-white mb-3">My Recent Registrations</h3>
            <Card className="overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {recentRegistrations.map(reg => (
                  <div key={reg.id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{(reg as any).event?.title || 'Event'}</p>
                      <p className="text-xs text-gray-400">{(reg as any).event?.date ? formatDate((reg as any).event.date) : ''}</p>
                    </div>
                    <Badge variant={reg.status === 'attended' ? 'success' : 'default'}>
                      {reg.status === 'attended' ? '✓ Attended' : 'Registered'}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  )
}
