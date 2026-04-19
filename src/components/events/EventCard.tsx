'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, Users, CalendarDays, ChevronDown, ChevronUp, MessageSquare, Star, X, Calendar as CalendarIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Card, Badge, Textarea } from '@/components/ui/index'
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
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const supabase = createClient()

  const isRegistered = registeredIds.includes(event.id)
  const isFull = event.seats_filled >= event.seats
  const isPast = isEventPast(event.date)
  const pct = getSeatsPercent(event.seats_filled, event.seats)
  const seatsLeft = event.seats - event.seats_filled

  const handleRegister = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isRegistered || isPast) return
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Please sign in first'); setLoading(false); return }

    const statusToInsert = isFull ? 'waitlisted' : 'registered'

    const { error } = await supabase.from('registrations').insert({ user_id: user.id, event_id: event.id, status: statusToInsert })
    if (error) {
      toast.error(error.message)
    } else {
      if (isFull) {
        toast.success('Added to waitlist! We will notify you if a spot opens up.')
      } else {
        toast.success('Successfully registered! 🎉')
      }
      onRegister?.()
    }
    setLoading(false)
  }

  const handleCalendarExport = (e: React.MouseEvent) => {
    e.stopPropagation()
    const start = new Date(event.date).toISOString().replace(/-|:|\.\d+/g, '')
    const end = event.end_date ? new Date(event.end_date).toISOString().replace(/-|:|\.\d+/g, '') : start
    const icsString = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:${event.title}\nDTSTART:${start}\nDTEND:${end}\nLOCATION:${event.location || ''}\nDESCRIPTION:${event.description || ''}\nEND:VEVENT\nEND:VCALENDAR`
    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title.replace(/\s+/g, '_')}.ics`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleFeedbackSubmit = () => {
    if (feedbackRating === 0) { toast.error('Please select a rating'); return }
    // Mock storing feedback
    toast.success('Thank you! Your feedback helps us improve future events.')
    setFeedbackOpen(false)
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

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {event.tags.map((tag, i) => (
                <span key={i} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {tag}
                </span>
              ))}
            </div>
          )}

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
          {!isPast ? (
            isRegistered ? (
              <div className="flex flex-col gap-2">
                <Button variant="secondary" size="sm" disabled className="w-full">
                  ✓ Registered
                </Button>
                <Button variant="secondary" size="sm" onClick={handleCalendarExport} className="w-full gap-2">
                  <CalendarIcon className="h-4 w-4" /> Add to Calendar
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
                loading={loading}
                onClick={handleRegister}
                className="w-full"
              >
                {isFull ? 'Join Waitlist' : 'Quick Register'}
              </Button>
            )
          ) : (
            isRegistered && (
              <Button variant="secondary" size="sm" onClick={() => setFeedbackOpen(true)} className="w-full gap-2 bg-purple-50 text-purple-600 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400">
                <MessageSquare className="h-4 w-4" /> Give Feedback
              </Button>
            )
          )}
        </div>
      </Card>

      {/* Feedback Modal */}
      <AnimatePresence>
        {feedbackOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setFeedbackOpen(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
              onClick={e => e.stopPropagation()}>
              <button onClick={() => setFeedbackOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white">
                <X className="h-5 w-5" />
              </button>
              
              <div className="p-8 pb-6 text-center border-b border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/40 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-purple-500 fill-current" />
                </div>
                <h3 className="text-xl font-bold font-display text-gray-900 dark:text-white mb-2">How was the event?</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{event.title}</p>
              </div>

              <div className="p-8 pt-6 space-y-6">
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setFeedbackRating(star)}
                      className={`transition-colors ${feedbackRating >= star ? 'text-purple-500' : 'text-gray-200 dark:text-gray-700 hover:text-purple-300'}`}>
                      <Star className={`w-8 h-8 ${feedbackRating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                
                <Textarea 
                  placeholder="Tell us what you liked or how we can improve..." 
                  rows={4} 
                  value={feedbackComment} 
                  onChange={e => setFeedbackComment(e.target.value)} 
                />

                <Button variant="secondary" className="w-full bg-purple-500 text-white hover:bg-purple-600" onClick={handleFeedbackSubmit}>
                  Submit Feedback
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
