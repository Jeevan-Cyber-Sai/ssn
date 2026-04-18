'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Clock, Users, CalendarDays, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Card, Badge } from '@/components/ui/index'
import Button from '@/components/ui/Button'
import { formatDateTime, getSeatsPercent, cn, isEventPast } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Event } from '@/types/database'

interface EventCardProps {
  event: Event
  compact?: boolean
  registeredIds?: string[]
  onRegister?: () => void
}

export default function EventCard({ event, compact = false, registeredIds = [], onRegister }: EventCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const isRegistered = registeredIds.includes(event.id)
  const isFull = event.seats_filled >= event.seats
  const isPast = isEventPast(event.date)
  const pct = getSeatsPercent(event.seats_filled, event.seats)
  const seatsLeft = event.seats - event.seats_filled

  const handleRegister = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRegistered || isFull || isPast) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in first'); setLoading(false); return }

    const { error } = await supabase.from('registrations').insert({ user_id: user.id, event_id: event.id })
    if (error) {
      toast.error(error.message)
    } else {
      toast.success('Successfully registered! 🎉')
      onRegister?.()
    }
    setLoading(false)
  }

  const orgColor = event.event_type === 'NSS' ? 'nss' : 'yrc'

  if (compact) {
    return (
      <Card hover className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={orgColor}>{event.event_type}</Badge>
              {isPast && <Badge variant="default">Past</Badge>}
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{event.title}</h4>
            <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
              <CalendarDays className="h-3 w-3" /> {formatDateTime(event.date)}
            </p>
          </div>
          {!isPast && !isRegistered && (
            <Button variant={event.event_type === 'NSS' ? 'nss' : 'yrc'} size="sm" onClick={handleRegister} loading={loading} disabled={isFull}>
              {isFull ? 'Full' : 'Register'}
            </Button>
          )}
          {isRegistered && <Badge variant="success">Registered</Badge>}
        </div>

        {/* Seat bar */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
            <span>{seatsLeft} seats left</span>
            <span>{event.seats_filled}/{event.seats}</span>
          </div>
          <div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className={cn('h-full rounded-full seat-bar', pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </Card>
    )
  }

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="overflow-hidden">
        {/* Header gradient */}
        <div className={cn('h-2 w-full', event.event_type === 'NSS' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-red-900 to-red-700')} />

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={orgColor}>{event.event_type}</Badge>
                {isPast && <Badge>Past Event</Badge>}
                {isRegistered && <Badge variant="success">Registered</Badge>}
              </div>
              <h3 className="font-bold font-display text-gray-900 dark:text-white leading-tight">{event.title}</h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5 flex-shrink-0" />{formatDateTime(event.date)}</div>
            {event.location && <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 flex-shrink-0" />{event.location}</div>}
            {event.hours > 0 && <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 flex-shrink-0" />{event.hours}h credited</div>}
            <div className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 flex-shrink-0" />{seatsLeft} / {event.seats} seats</div>
          </div>

          {/* Seat bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={cn('h-full rounded-full seat-bar', pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Description toggle */}
          {event.description && (
            <div className="mb-4">
              <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {expanded ? 'Hide details' : 'Show details'}
              </button>
              <motion.div
                initial={false}
                animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">{event.description}</p>
              </motion.div>
            </div>
          )}

          {/* Action */}
          {!isPast && (
            isRegistered ? (
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm" disabled className="w-full">
                  ✓ Registered
                </Button>
                <Button 
                  variant={event.event_type === 'NSS' ? 'nss' : 'yrc'} 
                  size="sm" 
                  className="w-full gap-2"
                  onClick={(e) => { e.stopPropagation(); window.location.href = `/events/${event.id}/chat` }}
                >
                  <Users className="h-4 w-4" /> Group Discussion
                </Button>
              </div>
            ) : (
              <Button
                variant={event.event_type === 'NSS' ? 'nss' : 'yrc'}
                size="sm"
                disabled={isFull}
                loading={loading}
                onClick={handleRegister}
                className="w-full"
              >
                {isFull ? 'Event Full' : 'Quick Register'}
              </Button>
            )
          )}
        </div>
      </Card>
    </motion.div>
  )
}
