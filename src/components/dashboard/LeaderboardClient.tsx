'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Clock, CheckCircle, Medal } from 'lucide-react'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge } from '@/components/ui/index'
import { orgGradient, cn } from '@/lib/utils'
import type { Profile, LeaderboardEntry } from '@/types/database'

type SortKey = 'events_attended' | 'total_hours'

export default function LeaderboardClient({ profile, leaderboard }: { profile: Profile; leaderboard: LeaderboardEntry[] }) {
  const [sort, setSort] = useState<SortKey>('events_attended')
  const grad = orgGradient(profile.org)

  const sorted = [...leaderboard].sort((a, b) => {
    if (sort === 'events_attended') return b.events_attended - a.events_attended || b.total_hours - a.total_hours
    return b.total_hours - a.total_hours || b.events_attended - a.events_attended
  })

  const myRank = sorted.findIndex(e => e.id === profile.id) + 1
  const myEntry = sorted.find(e => e.id === profile.id)

  const medalColors: Record<number, string> = {
    1: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    2: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    3: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
  }

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title="Leaderboard" />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">

        {/* Header banner */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-r p-6 text-white', grad)}>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10">
              <Trophy className="h-24 w-24" />
            </div>
            <div className="relative flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold font-display mb-1">{profile.org} Leaderboard</h2>
                <p className="text-white/70 text-sm">{leaderboard.length} volunteers ranked</p>
              </div>
              {myRank > 0 && (
                <div className="text-right">
                  <p className="text-white/70 text-xs mb-0.5">Your Rank</p>
                  <p className="text-3xl font-extrabold font-display">#{myRank}</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* My rank card (if not in top 3) */}
        {myEntry && myRank > 3 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-4 border-2 border-red-200 dark:border-red-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center font-bold font-display">
                  #{myRank}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">{myEntry.name} <span className="text-red-500">(You)</span></p>
                  <p className="text-xs text-gray-400">{myEntry.department}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{sort === 'events_attended' ? myEntry.events_attended : myEntry.total_hours}</p>
                  <p className="text-xs text-gray-400">{sort === 'events_attended' ? 'events' : 'hours'}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Sort tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          <button onClick={() => setSort('events_attended')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              sort === 'events_attended' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            <CheckCircle className="h-3.5 w-3.5" /> Events Attended
          </button>
          <button onClick={() => setSort('total_hours')}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200',
              sort === 'total_hours' ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700')}>
            <Clock className="h-3.5 w-3.5" /> Volunteer Hours
          </button>
        </div>

        {/* Top 3 podium */}
        {sorted.length >= 3 && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="grid grid-cols-3 gap-3 mb-2">
              {[sorted[1], sorted[0], sorted[2]].map((entry, podiumIdx) => {
                const rank = podiumIdx === 0 ? 2 : podiumIdx === 1 ? 1 : 3
                const heights = ['h-24', 'h-32', 'h-20']
                const isMe = entry?.id === profile.id
                return entry ? (
                  <motion.div key={entry.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + podiumIdx * 0.08 }}>
                    <Card className={cn('p-4 text-center', isMe && 'border-2 border-red-400 dark:border-red-600')}>
                      <div className={cn('w-10 h-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold mx-auto mb-2', grad)}>
                        {entry.name.charAt(0)}
                      </div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{entry.name.split(' ')[0]}{isMe && ' 👤'}</p>
                      <p className="text-[10px] text-gray-400 mb-2 truncate">{entry.department.split(' ')[0]}</p>
                      <div className={cn('inline-flex items-center justify-center w-8 h-8 rounded-lg border font-bold text-sm', medalColors[rank] || 'bg-gray-100 text-gray-500')}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </div>
                      <p className="text-sm font-extrabold font-display mt-1">{sort === 'events_attended' ? entry.events_attended : entry.total_hours}</p>
                      <p className="text-[10px] text-gray-400">{sort === 'events_attended' ? 'events' : 'hrs'}</p>
                    </Card>
                  </motion.div>
                ) : <div key={podiumIdx} />
              })}
            </div>
          </motion.div>
        )}

        {/* Full list */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Card className="overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between text-xs text-gray-400 font-semibold">
              <span>VOLUNTEER</span>
              <div className="flex gap-8">
                <span>EVENTS</span>
                <span>HOURS</span>
              </div>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
              {sorted.map((entry, i) => {
                const rank = i + 1
                const isMe = entry.id === profile.id
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.02 * i }}
                    className={cn('flex items-center gap-3 px-5 py-3.5 transition-colors', isMe && 'bg-red-50 dark:bg-red-900/10')}
                  >
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 border',
                      medalColors[rank] || 'bg-gray-50 dark:bg-gray-800/50 text-gray-500 border-gray-100 dark:border-gray-800'
                    )}>
                      {rank <= 3 ? (rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉') : rank}
                    </div>

                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0 bg-gradient-to-br', grad)}>
                      {entry.name.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-semibold truncate', isMe && 'text-red-600 dark:text-red-400')}>
                        {entry.name}{isMe && ' (You)'}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{entry.department} · Year {entry.year}</p>
                    </div>

                    <div className="flex gap-6 text-right flex-shrink-0">
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.events_attended}</p>
                        <p className="text-[10px] text-gray-400">events</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{entry.total_hours}</p>
                        <p className="text-[10px] text-gray-400">hours</p>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
