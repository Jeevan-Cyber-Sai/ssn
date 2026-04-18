'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { UserCheck, ChevronDown, CheckCircle, Clock, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import TopBar from '@/components/shared/TopBar'
import { Card, Badge, Skeleton } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDateTime } from '@/lib/utils'
import type { Profile, Event } from '@/types/database'

interface RegWithProfile {
  id: string
  user_id: string
  status: string
  profile: { name: string; email: string; roll_number: string | null }
}

export default function AdminAttendanceClient({ profile, events }: { profile: Profile; events: Event[] }) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [registrations, setRegistrations] = useState<RegWithProfile[]>([])
  const [loadingRegs, setLoadingRegs] = useState(false)
  const [marking, setMarking] = useState<string | null>(null)
  const supabase = createClient()

  const loadRegistrations = useCallback(async (event: Event) => {
    setSelectedEvent(event)
    setLoadingRegs(true)
    const { data } = await supabase
      .from('registrations')
      .select('id, user_id, status, profile:profiles(name, email, roll_number)')
      .eq('event_id', event.id)
      .order('registered_at')
    setRegistrations((data || []) as unknown as RegWithProfile[])
    setLoadingRegs(false)
  }, [supabase])

  const handleToggle = async (reg: RegWithProfile) => {
    const newStatus = reg.status === 'attended' ? 'registered' : 'attended'
    setMarking(reg.id)
    const { error } = await supabase.from('registrations').update({ status: newStatus }).eq('id', reg.id)
    if (error) { toast.error(error.message); setMarking(null); return }
    setRegistrations(prev => prev.map(r => r.id === reg.id ? { ...r, status: newStatus } : r))
    toast.success(`${reg.profile.name} marked as ${newStatus}`)
    setMarking(null)
  }

  const markAll = async (status: 'attended' | 'registered') => {
    if (!selectedEvent) return
    if (!confirm(`Mark ALL as "${status}"?`)) return
    const { error } = await supabase.from('registrations').update({ status }).eq('event_id', selectedEvent.id)
    if (error) { toast.error(error.message); return }
    setRegistrations(prev => prev.map(r => ({ ...r, status })))
    toast.success(`All marked as ${status}`)
  }

  const attendedCount = registrations.filter(r => r.status === 'attended').length

  return (
    <div className="flex-1 flex flex-col">
      <TopBar profile={profile} title="Attendance" />
      <main className="flex-1 px-4 md:px-6 py-6 space-y-6">

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Event selector */}
          <div className="space-y-3">
            <h3 className="font-bold font-display">Select Event</h3>
            {events.length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">No past events yet</Card>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {events.map(ev => (
                  <button key={ev.id} onClick={() => loadRegistrations(ev)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedEvent?.id === ev.id
                        ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                        : 'border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}>
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant={ev.event_type === 'NSS' ? 'nss' : 'yrc'}>{ev.event_type}</Badge>
                      <span className="text-xs text-gray-400">{ev.seats_filled} registered</span>
                    </div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{ev.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(ev.date)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Registrations panel */}
          <div className="lg:col-span-2 space-y-4">
            {!selectedEvent ? (
              <Card className="p-12 text-center">
                <UserCheck className="h-10 w-10 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400">Select an event to manage attendance</p>
              </Card>
            ) : (
              <>
                {/* Event header */}
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-bold font-display text-gray-900 dark:text-white">{selectedEvent.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{formatDateTime(selectedEvent.date)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-extrabold font-display">{attendedCount}/{registrations.length}</p>
                      <p className="text-xs text-gray-400">attended</p>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="mt-3">
                    <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: registrations.length ? `${(attendedCount / registrations.length) * 100}%` : '0%' }} />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" size="sm" onClick={() => markAll('attended')}>
                      <CheckCircle className="h-3.5 w-3.5" /> Mark All Present
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => markAll('registered')}>
                      Reset All
                    </Button>
                  </div>
                </Card>

                {/* Registrations list */}
                <Card className="overflow-hidden">
                  {loadingRegs ? (
                    <div className="p-4 space-y-3">
                      {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                    </div>
                  ) : registrations.length === 0 ? (
                    <div className="p-10 text-center text-gray-400">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">No registrations for this event</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-50 dark:divide-gray-800/60">
                      {registrations.map(reg => (
                        <div key={reg.id} className={`flex items-center justify-between px-5 py-3 transition-colors ${
                          reg.status === 'attended' ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${
                              reg.status === 'attended' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                            }`}>
                              {reg.profile.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{reg.profile.name}</p>
                              <p className="text-xs text-gray-400">{reg.profile.roll_number || reg.profile.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant={reg.status === 'attended' ? 'success' : 'default'}>
                              {reg.status === 'attended' ? '✓ Present' : 'Absent'}
                            </Badge>
                            <button onClick={() => handleToggle(reg)} disabled={marking === reg.id}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                reg.status === 'attended'
                                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 hover:bg-red-50 hover:text-red-500'
                                  : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200'
                              }`}>
                              {marking === reg.id ? '...' : reg.status === 'attended' ? 'Unmark' : 'Mark Present'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
