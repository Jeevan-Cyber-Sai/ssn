'use client'
import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Search, CalendarDays } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import EventCard from './EventCard'
import { CardSkeleton, EmptyState } from '@/components/ui/index'
import { cn } from '@/lib/utils'
import type { Profile, Event } from '@/types/database'

type Tab = 'upcoming' | 'past'

export default function EventsClient({ profile, registeredIds: initial }: { profile: Profile; registeredIds: string[] }) {
  const [tab, setTab] = useState<Tab>('upcoming')
  const [search, setSearch] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [registeredIds, setRegisteredIds] = useState<string[]>(initial)
  const supabase = createClient()

  const fetchEvents = useCallback(async () => {
    setLoading(true)
    const now = new Date().toISOString()
    let query = supabase.from('events').select('*').eq('event_type', profile.org).eq('is_active', true)
    if (tab === 'upcoming') {
      query = query.gte('date', now).order('date', { ascending: true })
    } else {
      query = query.lt('date', now).order('date', { ascending: false })
    }
    const { data } = await query
    setEvents(data || [])
    setLoading(false)
  }, [supabase, profile.org, tab])

  useEffect(() => { fetchEvents() }, [fetchEvents])

  const handleRegister = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('registrations').select('event_id').eq('user_id', user.id)
    setRegisteredIds((data || []).map((r: any) => r.event_id))
  }

  const filtered = events.filter(e => e.title.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title="Events" />
      <main className="flex-1 px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold font-display">{profile.org} Events</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Browse and register for your organisation&apos;s events</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Tabs */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
              {(['upcoming', 'past'] as Tab[]).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn('px-4 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 capitalize',
                    tab === t ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  )}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500 transition-colors"
          />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="h-7 w-7" />}
            title={search ? 'No events match your search' : tab === 'upcoming' ? 'No upcoming events' : 'No past events'}
            description={tab === 'upcoming' ? 'Check back soon — events will be posted here.' : undefined}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filtered.map(event => (
              <EventCard key={event.id} event={event} registeredIds={registeredIds} onRegister={handleRegister} />
            ))}
          </motion.div>
        )}
      </main>
    </div>
  )
}
